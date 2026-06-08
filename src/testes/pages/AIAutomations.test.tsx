import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIAutomations from '@/pages/AIAutomations';
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

// Mock complex child components to focus on the page routing/layout
vi.mock('@/components/ai/FlashcardsGenerator', () => ({ FlashcardsGenerator: () => <div data-testid="flashcards-gen" /> }));
vi.mock('@/components/ai/SummaryGenerator', () => ({ SummaryGenerator: () => <div data-testid="summary-gen" /> }));
vi.mock('@/components/ai/MindMapGenerator', () => ({ MindMapGenerator: () => <div data-testid="mindmap-gen" /> }));
vi.mock('@/components/ai/PortfolioCertificates', () => ({ PortfolioCertificates: () => <div data-testid="portfolio-cert" /> }));

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

describe('AIAutomations Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <AuthProvider>
      <MemoryRouter>
        <AIAutomations />
      </MemoryRouter>
    </AuthProvider>
  );

  it('renderiza tela de loading inicialmente e depois a página', async () => {
    renderComponent();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Automações IA')).toBeInTheDocument();
  });

  it('renderiza as abas e o conteúdo padrão (Flashcards)', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Flashcards')).toBeInTheDocument();
      expect(screen.getByText('Resumos')).toBeInTheDocument();
      expect(screen.getByText('Mapas Mentais')).toBeInTheDocument();
      expect(screen.getByText('Portfólio')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('flashcards-gen')).toBeInTheDocument();
  });

  it('muda de aba corretamente', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Resumos')).toBeInTheDocument();
    });
    
    // Use userEvent.click instead of fireEvent.click for Radix UI tabs
    await user.click(screen.getByText('Resumos'));
    
    await waitFor(() => {
      expect(screen.getByTestId('summary-gen')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Mapas Mentais'));
    
    await waitFor(() => {
      expect(screen.getByTestId('mindmap-gen')).toBeInTheDocument();
    });
  });

  it('navega para trás ao clicar em Voltar', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Voltar'));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('faz logout ao clicar no botão de sair', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Automações IA')).toBeInTheDocument();
    });
    
    // O botão de sair é o último botão. Podemos achar pelo ícone ou classe
    const logoutBtn = screen.getByRole('button', { name: '' }).closest('button.hover\\:text-destructive');
    if (logoutBtn) {
      await user.click(logoutBtn);
    }
    
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
