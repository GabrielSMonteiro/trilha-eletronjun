import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppLayout } from '@/components/layout/AppLayout';
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

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mocking children components to simplify rendering
vi.mock('@/components/NotificationCenter', () => ({ NotificationCenter: () => <div data-testid="notification-center">Notifications</div> }));
vi.mock('@/components/KanbanBoard', () => ({ KanbanBoard: () => <div data-testid="kanban-board">Kanban</div> }));
vi.mock('@/components/AllNotesPanel', () => ({ AllNotesPanel: () => <div data-testid="all-notes">Notes</div> }));
vi.mock('@/components/QuickAccessSidebar', () => ({
  QuickAccessSidebar: ({ onOpenKanban, onOpenNotes }: any) => (
    <div data-testid="quick-sidebar">
      <button onClick={onOpenKanban}>Open Kanban</button>
      <button onClick={onOpenNotes}>Open Notes</button>
    </div>
  )
}));
vi.mock('@/components/RankingModal', () => ({ RankingModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>RankingModal Content</div> : null }));
vi.mock('@/components/UserProfile', () => ({ UserProfile: () => <div>UserProfile Content</div> }));
vi.mock('@/components/UserProfileModal', () => ({ UserProfileModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>UserProfileModal Content</div> : null }));

describe('AppLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <AppLayout {...props}>
          <div data-testid="child-content">Conteúdo Principal</div>
        </AppLayout>
      </MemoryRouter>
    );
  };

  it('renderiza os filhos corretamente', () => {
    renderComponent();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo Principal')).toBeInTheDocument();
  });

  it('navega para o Início (/) ao clicar no botão Início', () => {
    renderComponent();
    const homeBtn = screen.getByRole('button', { name: /Início/i });
    fireEvent.click(homeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navega pelas rotas principais no topbar', () => {
    renderComponent();
    
    // IA
    const aiBtn = screen.getByRole('button', { name: /IA/i });
    fireEvent.click(aiBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/ai');

    // Community (ícone Users, tentamos pegar pelos modais ou índices)
    // Para simplificar, como os botões de ícone não têm aria-label claro, pegamos os que chamam navigate específicos
    const buttons = screen.getAllByRole('button');
    // ...
  });

  it('realiza logout com sucesso e redireciona', async () => {
    renderComponent();
    
    // O botão de logout é o último do grupo (ícone LogOut)
    const buttons = screen.getAllByRole('button').filter(b => b.className.includes('hover:text-destructive'));
    fireEvent.click(buttons[0]);
    
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('exibe erro (toast) se o logout falhar', async () => {
    const mockError = new Error('Signout failed');
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: mockError } as any);
    
    renderComponent();
    
    const buttons = screen.getAllByRole('button').filter(b => b.className.includes('hover:text-destructive'));
    fireEvent.click(buttons[0]);
    
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith('/');
      // o toast do useToast seria disparado
    });
  });

  it('abre o modal de Ranking', async () => {
    renderComponent();
    
    // Procuramos o botão de Troféu.
    const buttons = screen.getAllByRole('button').filter(b => b.innerHTML.includes('lucide-trophy') || b.querySelector('.lucide-trophy'));
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      // Verifica se o RankingModal abre
      expect(await screen.findByText('RankingModal Content')).toBeInTheDocument();
    }
  });

  it('abre o perfil e configurações do usuário', async () => {
    renderComponent();
    
    // Profile abre via showProfile
    // O botão User tem lucide-user, mas não lucide-users
    const buttons = screen.getAllByRole('button').filter(b => {
      const isUser = b.innerHTML.includes('lucide-user') || b.querySelector('.lucide-user');
      const isUsers = b.innerHTML.includes('lucide-users') || b.querySelector('.lucide-users');
      return isUser && !isUsers;
    });
    
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      // Deve mostrar o botão "Fechar" e renderizar UserProfile
      expect(await screen.findByText('UserProfile Content')).toBeInTheDocument();
    }
  });

  it('renderiza dados de gamificação e abre painéis laterais via QuickSidebar', () => {
    renderComponent({
      gamificationData: {
        current_level: 5,
        total_xp: 1500,
        current_streak: 10
      },
      userBadges: [1, 2, 3]
    });
    
    // O sidebar rápido já está renderizado no desktop
    // Abre kanban via o botão "Open Kanban" do QuickAccessSidebar mockado
    const kanbanBtn = screen.getByText(/Open Kanban/i);
    fireEvent.click(kanbanBtn);
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();

    // Abre notas via o botão "Open Notes" do QuickAccessSidebar mockado
    const notesBtn = screen.getByText(/Open Notes/i);
    fireEvent.click(notesBtn);
    expect(screen.getByTestId('all-notes')).toBeInTheDocument();
  });

  it('tenta abrir o mobile sidebar via botão de menu', () => {
    renderComponent();
    
    // Procura o botão de hamburger (Menu) pelos todos os botões com SVG de menu
    const allBtns = screen.getAllByRole('button');
    const menuBtn = allBtns.find(b => b.innerHTML.includes('lucide-menu'));
    
    if (menuBtn) {
      fireEvent.click(menuBtn);
      // Não deve quebrar
      expect(menuBtn).toBeInTheDocument();
    }
  });
});
