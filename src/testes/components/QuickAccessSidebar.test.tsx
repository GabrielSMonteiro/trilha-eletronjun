import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickAccessSidebar } from '@/components/QuickAccessSidebar';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('QuickAccessSidebar', () => {
  const defaultProps = {
    isExpanded: true,
    onToggle: vi.fn(),
    onOpenNotes: vi.fn(),
    onOpenKanban: vi.fn(),
    isKanbanOpen: false,
    isNotesOpen: false,
    gamificationData: null,
    badgesCount: 0
  };

  const renderComponent = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <QuickAccessSidebar {...props} />
      </MemoryRouter>
    );
  };

  it('renderiza botões de ação', () => {
    renderComponent();
    expect(screen.getByText('Anotações')).toBeInTheDocument();
    expect(screen.getByText('Meu Progresso')).toBeInTheDocument(); // O Kanban agora é chamado de Meu Progresso
    expect(screen.getByText('Cafeteria Virtual')).toBeInTheDocument();
  });

  it('chama onOpenNotes ao clicar em Anotações', () => {
    const onOpenNotes = vi.fn();
    renderComponent({ ...defaultProps, onOpenNotes });
    fireEvent.click(screen.getByText('Anotações'));
    expect(onOpenNotes).toHaveBeenCalled();
  });

  it('chama onOpenKanban ao clicar em Meu Progresso', () => {
    const onOpenKanban = vi.fn();
    renderComponent({ ...defaultProps, onOpenKanban });
    fireEvent.click(screen.getByText('Meu Progresso'));
    expect(onOpenKanban).toHaveBeenCalled();
  });

  it('navega para cafeteria ao clicar em Cafeteria Virtual', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Cafeteria Virtual'));
    expect(mockNavigate).toHaveBeenCalledWith('/cafe');
  });

  it('exibe cards de gamificação quando dados disponíveis', () => {
    renderComponent({
      ...defaultProps,
      gamificationData: {
        current_level: 5,
        total_xp: 1200,
        current_streak: 7
      },
      badgesCount: 3
    });
    expect(screen.getByText('5')).toBeInTheDocument(); // Nível
    expect(screen.getByText('1200')).toBeInTheDocument(); // XP
    expect(screen.getByText('7 dias')).toBeInTheDocument(); // Sequência
    expect(screen.getByText('3')).toBeInTheDocument(); // Conquistas
  });

  it('colapsa a sidebar ao clicar no botão de toggle', () => {
    renderComponent();
    // Inicialmente expandido - textos visíveis
    expect(screen.getByText('Anotações')).toBeInTheDocument();
    
    // Clica no botão de toggle (o pequeno botão circular com ChevronLeft)
    // É o primeiro botão na sidebar (variant ghost, size sm)
    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);
    
    // Após colapsar, os textos devem sumir pois isExpanded && <span>
    expect(screen.queryByText('Anotações')).not.toBeInTheDocument();
  });
});
