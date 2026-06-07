import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Auth from '@/pages/Auth';
import { AuthProvider } from '@/contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/components/auth/AuthBackgroundCarousel', () => ({
  default: () => <div data-testid="bg-carousel" />,
}));

const { mockGetUser, mockSignIn, mockSignUp, mockResetPassword, mockGetSession, mockOnAuthStateChange, mockMaybySingle } =
  vi.hoisted(() => {
    const mockGetUser = vi.fn();
    const mockSignIn = vi.fn();
    const mockSignUp = vi.fn();
    const mockResetPassword = vi.fn();
    const mockGetSession = vi.fn();
    const mockMaybySingle = vi.fn();
    const mockOnAuthStateChange = vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));
    return {
      mockGetUser, mockSignIn, mockSignUp, mockResetPassword,
      mockGetSession, mockOnAuthStateChange, mockMaybySingle,
    };
  });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPassword,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybySingle,
    })),
  },
}));

const renderAuth = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </BrowserRouter>
  );

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockMaybySingle.mockResolvedValue({ data: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('renders the CapacitaJUN heading', async () => {
    await act(async () => renderAuth());
    expect(screen.getByText('CapacitaJUN')).toBeInTheDocument();
  });

  it('renders sign-in tab active by default', async () => {
    await act(async () => renderAuth());
    expect(screen.getAllByPlaceholderText('seu.email@eletronjun.com.br').length).toBeGreaterThan(0);
  });

  it('renders "Voltar" navigation button', async () => {
    await act(async () => renderAuth());
    expect(screen.getByText('Voltar')).toBeInTheDocument();
  });

  it('navigates to "/" when Voltar is clicked', async () => {
    await act(async () => renderAuth());
    fireEvent.click(screen.getByText('Voltar'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  describe('Sign-in form', () => {
    it('submits correct credentials and navigates to /app for regular users', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { id: '123', email: 'user@eletronjun.com.br' } },
        error: null,
      });
      mockMaybySingle.mockResolvedValue({ data: null });

      await act(async () => renderAuth());

      const [emailInput] = screen.getAllByPlaceholderText('seu.email@eletronjun.com.br');
      const [passwordInput] = screen.getAllByPlaceholderText('••••••••');

      await userEvent.type(emailInput, 'user@eletronjun.com.br');
      await userEvent.type(passwordInput, 'mypassword');

      const submitButtons = screen.getAllByRole('button', { name: /^Entrar$/ });
      const submitBtn = submitButtons[submitButtons.length - 1];

      await act(async () => fireEvent.click(submitBtn));

      await waitFor(() =>
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'user@eletronjun.com.br',
          password: 'mypassword',
        })
      );

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/app'));
    });

    it('navigates to /admin for admin users after sign-in', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { id: 'admin-id', email: 'admin@eletronjun.com.br' } },
        error: null,
      });
      mockMaybySingle.mockResolvedValue({ data: { role: 'admin' } });

      await act(async () => renderAuth());

      const [emailInput] = screen.getAllByPlaceholderText('seu.email@eletronjun.com.br');
      const [passwordInput] = screen.getAllByPlaceholderText('••••••••');

      await userEvent.type(emailInput, 'admin@eletronjun.com.br');
      await userEvent.type(passwordInput, 'adminpass');

      const submitButtons = screen.getAllByRole('button', { name: /^Entrar$/ });
      await act(async () => fireEvent.click(submitButtons[submitButtons.length - 1]));

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
    });

    it('shows error toast when credentials are wrong', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      await act(async () => renderAuth());

      const [emailInput] = screen.getAllByPlaceholderText('seu.email@eletronjun.com.br');
      const [passwordInput] = screen.getAllByPlaceholderText('••••••••');

      await userEvent.type(emailInput, 'wrong@eletronjun.com.br');
      await userEvent.type(passwordInput, 'wrongpass');

      const submitButtons = screen.getAllByRole('button', { name: /^Entrar$/ });
      await act(async () => fireEvent.click(submitButtons[submitButtons.length - 1]));

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive', title: 'Erro no login' })
        )
      );
    });

    it('toggles password visibility when the eye button is clicked', async () => {
      await act(async () => renderAuth());

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const signinPasswordInput = passwordInputs[0];
      expect(signinPasswordInput).toHaveAttribute('type', 'password');

      const eyeBtn = signinPasswordInput.parentElement?.querySelector('button');
      expect(eyeBtn).toBeTruthy();

      fireEvent.click(eyeBtn!);
      expect(signinPasswordInput).toHaveAttribute('type', 'text');

      fireEvent.click(eyeBtn!);
      expect(signinPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Sign-up form', () => {
    const activateSignupTab = async () => {
      const user = userEvent.setup();
      const signupTab = screen.getByRole('tab', { name: /Cadastrar/i });
      await user.click(signupTab);
      await waitFor(() =>
        expect(screen.getByPlaceholderText('João Silva')).toBeInTheDocument()
      );
    };

    const fillSignupForm = async () => {
      await userEvent.type(screen.getByPlaceholderText('João Silva'), 'Gabriel Monteiro');
      const emailInputs = screen.getAllByPlaceholderText('seu.email@eletronjun.com.br');
      await userEvent.type(emailInputs[emailInputs.length - 1], 'gabriel@eletronjun.com.br');
      await userEvent.type(
        screen.getByPlaceholderText('Desenvolvedor, Designer, etc.'),
        'Desenvolvedor'
      );
      const passInputs = screen.getAllByPlaceholderText('••••••••');
      await userEvent.type(passInputs[passInputs.length - 1], 'senha123');
    };

    it('shows signup form when Cadastrar tab is clicked', async () => {
      await act(async () => renderAuth());
      await activateSignupTab();
      expect(screen.getByPlaceholderText('João Silva')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Desenvolvedor, Designer, etc.')).toBeInTheDocument();
    });

    it('successfully registers and shows success toast', async () => {
      mockSignUp.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });

      await act(async () => renderAuth());
      await activateSignupTab();
      await fillSignupForm();

      const submitBtn = screen.getByRole('button', { name: /Criar conta/i });
      await act(async () => fireEvent.click(submitBtn));

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Cadastro realizado!' })
        )
      );
    });

    it('shows "usuário já cadastrado" toast when email is already registered', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await act(async () => renderAuth());
      await activateSignupTab();
      await fillSignupForm();

      const submitBtn = screen.getByRole('button', { name: /Criar conta/i });
      await act(async () => fireEvent.click(submitBtn));

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Usuário já cadastrado', variant: 'destructive' })
        )
      );
    });

    it('shows generic error toast for other signup errors', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Some other error' },
      });

      await act(async () => renderAuth());
      await activateSignupTab();
      await fillSignupForm();

      const submitBtn = screen.getByRole('button', { name: /Criar conta/i });
      await act(async () => fireEvent.click(submitBtn));

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Erro no cadastro', variant: 'destructive' })
        )
      );
    });
  });

  describe('Forgot password form', () => {
    it('sends reset email and shows success toast', async () => {
      mockResetPassword.mockResolvedValue({ data: {}, error: null });

      await act(async () => renderAuth());

      const forgotTab = screen.getByRole('tab', { name: /Esqueci minha senha/i });
      await act(async () => fireEvent.click(forgotTab));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /Enviar link de recuperação/i })).toBeInTheDocument()
      );

      const forgotInputs = screen.getAllByPlaceholderText('seu.email@eletronjun.com.br');
      await userEvent.type(forgotInputs[forgotInputs.length - 1], 'recover@eletronjun.com.br');

      const sendBtn = screen.getByRole('button', { name: /Enviar link de recuperação/i });
      await act(async () => fireEvent.click(sendBtn));

      await waitFor(() =>
        expect(mockResetPassword).toHaveBeenCalledWith(
          'recover@eletronjun.com.br',
          expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
        )
      );

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Email enviado!' })
        )
      );
    });

    it('shows error toast when reset email fails', async () => {
      mockResetPassword.mockResolvedValue({
        data: {},
        error: { message: 'Email not found' },
      });

      await act(async () => renderAuth());

      const forgotTab = screen.getByRole('tab', { name: /Esqueci minha senha/i });
      await act(async () => fireEvent.click(forgotTab));

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /Enviar link de recuperação/i })).toBeInTheDocument()
      );

      const forgotInputs = screen.getAllByPlaceholderText('seu.email@eletronjun.com.br');
      await userEvent.type(forgotInputs[forgotInputs.length - 1], 'notfound@eletronjun.com.br');

      const sendBtn = screen.getByRole('button', { name: /Enviar link de recuperação/i });
      await act(async () => fireEvent.click(sendBtn));

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive' })
        )
      );
    });
  });

  describe('Auto-redirect on mount', () => {
    it('redirects to /app when a regular user is already logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'already-logged', email: 'user@eletronjun.com.br' } },
      });
      mockMaybySingle.mockResolvedValue({ data: null });

      await act(async () => renderAuth());
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/app'));
    });

    it('redirects to /admin when an admin user is already logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-logged', email: 'admin@eletronjun.com.br' } },
      });
      mockMaybySingle.mockResolvedValue({ data: { role: 'admin' } });

      await act(async () => renderAuth());
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
    });
  });
});
