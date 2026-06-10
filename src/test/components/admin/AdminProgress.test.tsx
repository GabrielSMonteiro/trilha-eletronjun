import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminProgress } from '@/components/admin/AdminProgress';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('lucide-react', () => ({
  BarChart: () => <span data-testid="icon-BarChart" />,
  TrendingUp: () => <span data-testid="icon-TrendingUp" />,
  Target: () => <span data-testid="icon-Target" />,
  Users: () => <span data-testid="icon-Users" />,
  Search: () => <span data-testid="icon-Search" />,
  BookOpen: () => <span data-testid="icon-BookOpen" />,
  ChevronDown: () => <span data-testid="icon-ChevronDown" />,
  ChevronUp: () => <span data-testid="icon-ChevronUp" />,
  Check: () => <span data-testid="icon-Check" />,
  X: () => <span data-testid="icon-X" />,
}));

const { mockFrom } = vi.hoisted(() => {
  const createChain = (data: any) => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      not: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => Promise.resolve({ data, error: null })),
      then: (resolve: any) => resolve({ data, error: null }),
    };
    return chain;
  };

  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case 'categories':
        return createChain([
          { id: 'cat-1', display_name: 'Categoria 1', name: 'cat1' },
        ]);
      case 'lessons':
        return createChain([{ id: 'lesson-1' }]);
      case 'user_progress':
        return createChain([
          { user_id: 'user-1', lesson_id: 'lesson-1', completed_at: '2026-01-01', score: 100 },
        ]);
      case 'user_roles':
        return createChain([{ user_id: 'admin-1' }]);
      case 'profiles':
        return createChain([
          { user_id: 'user-1', display_name: 'João Silva', position: 'Developer' },
        ]);
      default:
        return createChain([]);
    }
  });

  return { mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('AdminProgress Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<AdminProgress />);

  it('renders progress data', async () => {
    await act(async () => renderComponent());

    await waitFor(() => {
      
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      
      
      expect(screen.getByText('cat1')).toBeInTheDocument(); 
    });
  });

  it('filters users by search term', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Buscar usuário/i);
    await user.type(searchInput, 'Maria');

    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
  });

  it('opens user details modal', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('João Silva')).toBeInTheDocument());

    const seeMoreBtns = screen.getAllByRole('button', { name: /Ver mais/i });
    await user.click(seeMoreBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Progresso de João Silva')).toBeInTheDocument();
      expect(screen.getByText('Categoria 1')).toBeInTheDocument();
    });
  });
});
