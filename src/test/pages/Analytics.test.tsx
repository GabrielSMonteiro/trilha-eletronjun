import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Analytics from '@/pages/Analytics';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearNotification: vi.fn(),
    clearAll: vi.fn()
  })
}));

vi.mock('@/components/analytics/AnalyticsDashboard', () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard" />
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user1' } } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'user1' }, error: null })
    }))
  }
}));

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <AuthProvider>
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    </AuthProvider>
  );

  it('renderiza o componente AnalyticsDashboard após loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
  });

  it('navega para /app ao clicar em Voltar', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Voltar'));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('navega para /ai ao clicar no botão IA', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('IA')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('IA'));
    expect(mockNavigate).toHaveBeenCalledWith('/ai');
  });

  it('faz logout corretamente', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
    
    const logoutBtn = screen.getAllByRole('button').find(btn => btn.className.includes('hover:text-destructive'));
    if (logoutBtn) {
      fireEvent.click(logoutBtn);
    }
    
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
