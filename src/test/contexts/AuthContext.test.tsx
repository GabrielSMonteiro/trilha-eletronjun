import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const mockUnsubscribe = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      get getSession() { return mockGetSession; },
      get onAuthStateChange() { return mockOnAuthStateChange; },
    },
  },
}));

const makeSession = (id = 'u1', email = 'user@eletronjun.com.br') => ({
  user: { id, email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
});

const AuthConsumer = () => {
  const { user, session, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user?.email ?? 'no-user'}</span>
      <span data-testid="session">{session ? 'has-session' : 'no-session'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('starts in loading state', async () => {
    mockGetSession.mockReturnValue(new Promise(() => { }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('loading');
  });

  it('sets isLoading=false and user=null when there is no session', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    );
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    expect(screen.getByTestId('session').textContent).toBe('no-session');
  });

  it('populates user and session from getSession', async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session } });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    );
    expect(screen.getByTestId('user').textContent).toBe('user@eletronjun.com.br');
    expect(screen.getByTestId('session').textContent).toBe('has-session');
  });

  it('updates user when onAuthStateChange fires with a new session', async () => {
    let authChangeCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authChangeCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    );
    expect(screen.getByTestId('user').textContent).toBe('no-user');

    const newSession = makeSession('u2', 'newuser@eletronjun.com.br');
    authChangeCallback?.('SIGNED_IN', newSession);

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('newuser@eletronjun.com.br')
    );
  });

  it('clears user when onAuthStateChange fires with null session (sign-out)', async () => {
    const session = makeSession();
    mockGetSession.mockResolvedValue({ data: { session } });

    let authChangeCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authChangeCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('user@eletronjun.com.br')
    );

    authChangeCallback?.('SIGNED_OUT', null);

    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('no-user')
    );
  });

  it('unsubscribes from auth changes on unmount', async () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useAuth', () => {
  it('returns context value when inside AuthProvider', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toBeInTheDocument());
  });

  it('throws error when used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });
});
