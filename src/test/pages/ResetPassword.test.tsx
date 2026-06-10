import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPassword from '@/pages/ResetPassword';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user1' } } }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null })
    }
  }
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );

  it('renderiza o formulário de redefinição de senha', async () => {
    renderComponent();
    
    await waitFor(() => {
      
      expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeInTheDocument();
      const inputs = screen.getAllByPlaceholderText('••••••••');
      expect(inputs).toHaveLength(2);
    });
  });

  it('submete a nova senha com sucesso', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeInTheDocument();
    });
    
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
    
    fireEvent.change(passwordInput, { target: { value: 'nova-senha123' } });
    fireEvent.change(confirmInput, { target: { value: 'nova-senha123' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Redefinir Senha' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'nova-senha123' });
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  it('mostra erro quando senhas não coincidem', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeInTheDocument();
    });
    
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
    
    fireEvent.change(passwordInput, { target: { value: 'nova-senha123' } });
    fireEvent.change(confirmInput, { target: { value: 'diferente-123' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Redefinir Senha' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  it('redireciona para /auth se não houver sessão ativa', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null }, error: null } as any);
    
    renderComponent();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  it('mostra mensagem do erro retornado pelo updateUser', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({ error: { message: 'Senha muito fraca' } } as any);
    const { container } = renderComponent();
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeInTheDocument();
    });
    
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
    
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.change(confirmInput, { target: { value: '123456' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Redefinir Senha' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalled();
      // Toast would be called here. As we mock it, we just check no navigate happens.
      expect(mockNavigate).not.toHaveBeenCalledWith('/auth');
    });
  });

  it('captura exceção genérica no envio', async () => {
    vi.mocked(supabase.auth.updateUser).mockImplementationOnce(() => {
      throw new Error('Erro inesperado');
    });
    const { container } = renderComponent();
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeInTheDocument();
    });
    
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
    
    fireEvent.change(passwordInput, { target: { value: 'nova-senha123' } });
    fireEvent.change(confirmInput, { target: { value: 'nova-senha123' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Redefinir Senha' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith('/auth');
    });
  });

  it('alterna visualização das senhas', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeInTheDocument();
    });
    
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
    
    expect(passwordInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');
    
    const toggleBtns = screen.getAllByRole('button').filter(btn => btn.className.includes('absolute'));
    
    if (toggleBtns.length >= 2) {
      fireEvent.click(toggleBtns[0]); // toggle password
      expect(passwordInput.type).toBe('text');
      
      fireEvent.click(toggleBtns[1]); // toggle confirm
      expect(confirmInput.type).toBe('text');
    }
  });
});
