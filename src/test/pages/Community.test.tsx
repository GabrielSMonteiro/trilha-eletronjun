import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Community from '@/pages/Community';
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
  }),
  NotificationCenter: () => <div data-testid="notification-center" />
}));

vi.mock('@/components/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center" />
}));

vi.mock('@/components/community/ForumsList', () => ({ default: () => <div data-testid="forums-list" /> }));
vi.mock('@/components/community/StudyGroupsList', () => ({ default: () => <div data-testid="study-groups-list" /> }));
vi.mock('@/components/community/MentorshipBoard', () => ({ default: () => <div data-testid="mentorship-board" /> }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user1' } } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'user1' }, error: null })
    }))
  }
}));

describe('Community Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <AuthProvider>
      <MemoryRouter>
        <Community />
      </MemoryRouter>
    </AuthProvider>
  );

  it('renderiza o título e a descrição', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Comunidade')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Conecte-se, aprenda e cresça junto com outros estudantes')).toBeInTheDocument();
  });

  it('renderiza as abas e o conteúdo padrão (Fóruns)', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Fóruns')).toBeInTheDocument();
      expect(screen.getByText('Grupos')).toBeInTheDocument();
      expect(screen.getByText('Mentoria')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('forums-list')).toBeInTheDocument();
  });

  it('muda de aba corretamente para Grupos e Mentoria', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Grupos')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Grupos'));
    
    await waitFor(() => {
      expect(screen.getByTestId('study-groups-list')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Mentoria'));
    
    await waitFor(() => {
      expect(screen.getByTestId('mentorship-board')).toBeInTheDocument();
    });
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
});
