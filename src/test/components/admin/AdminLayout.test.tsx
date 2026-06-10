import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminLayout } from '@/components/admin/AdminLayout';
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

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  }
}));

vi.mock('@/components/admin/AdminDashboard', () => ({ AdminDashboard: () => <div data-testid="admin-dashboard" /> }));
vi.mock('@/components/admin/AdminUsers', () => ({ AdminUsers: () => <div data-testid="admin-users" /> }));
vi.mock('@/components/admin/AdminCategories', () => ({ AdminCategories: () => <div data-testid="admin-categories" /> }));
vi.mock('@/components/admin/AdminContent', () => ({ AdminContent: () => <div data-testid="admin-content" /> }));
vi.mock('@/components/admin/AdminProgress', () => ({ AdminProgress: () => <div data-testid="admin-progress" /> }));
vi.mock('@/components/admin/AdminBackgroundImages', () => ({ AdminBackgroundImages: () => <div data-testid="admin-backgrounds" /> }));

describe('AdminLayout', () => {
  const defaultProps = {
    user: {
      name: 'Admin User',
      email: 'admin@test.com',
      avatar: '',
      position: 'Administrator'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <AdminLayout {...defaultProps} />
    </MemoryRouter>
  );

  it('renderiza as informações do usuário', () => {
    renderComponent();
    expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
  });

  it('renderiza o dashboard por padrão', () => {
    renderComponent();
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('muda de seção ao clicar no menu', async () => {
    renderComponent();
    
    
    const usersBtn = screen.getAllByRole('button', { name: /Usuários/ })[0];
    fireEvent.click(usersBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-users')).toBeInTheDocument();
    });

    const categoriesBtn = screen.getAllByRole('button', { name: /Categorias/ })[0];
    fireEvent.click(categoriesBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('admin-categories')).toBeInTheDocument();
    });
  });

  it('faz logout ao clicar em sair', async () => {
    renderComponent();
    
    const logoutBtn = screen.getAllByRole('button', { name: /Sair/ })[0];
    fireEvent.click(logoutBtn);
    
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
