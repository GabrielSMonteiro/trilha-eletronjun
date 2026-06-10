import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Admin from '@/pages/Admin';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/admin/AdminLayout', () => ({
  AdminLayout: () => <div data-testid="admin-layout" />
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user1', email: 'admin@test.com' } } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    from: vi.fn((table) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { display_name: 'Admin User', position: 'Admin' }, error: null })
        };
      }
      return { select: vi.fn().mockReturnThis() };
    })
  }
}));

describe('Admin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <AuthProvider>
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    </AuthProvider>
  );

  it('exibe tela de carregamento inicialmente', () => {
    renderComponent();
    expect(screen.getByText('Carregando painel administrativo...')).toBeInTheDocument();
  });

  it('renderiza o AdminLayout quando autorizado', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    });
  });
});
