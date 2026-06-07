import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RankingModal } from '@/components/RankingModal';

vi.mock('lucide-react', () => ({
  Trophy: () => <span data-testid="trophy-icon" />,
  Medal: () => <span data-testid="medal-icon" />,
  Award: () => <span data-testid="award-icon" />,
  Calendar: () => <span data-testid="calendar-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

const { mockSupabaseFrom } = vi.hoisted(() => {
  const mockSupabaseFrom = vi.fn();
  return { mockSupabaseFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockSupabaseFrom },
}));

const setupEmptyMock = () => {
  mockSupabaseFrom.mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve({ data: [], error: null }),
  }));
};

describe('RankingModal', () => {
  it('não renderiza nada quando isOpen é false', () => {
    setupEmptyMock();
    render(<RankingModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Ranking do Mês')).not.toBeInTheDocument();
  });

  it('renderiza o modal e exibe estado vazio quando não há usuários', async () => {
    setupEmptyMock();

    await act(async () => {
      render(<RankingModal isOpen={true} onClose={vi.fn()} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Ranking do Mês')).toBeInTheDocument();
      expect(screen.getByText('Nenhum ranking este mês')).toBeInTheDocument();
    });
  });

  it('renderiza usuários no ranking quando há dados de progresso', async () => {
    const profiles = [
      { user_id: 'u1', display_name: 'Alice Souza', position: 'Dev', avatar_url: null },
      { user_id: 'u2', display_name: 'Bruno Lima', position: 'QA', avatar_url: null },
    ];
    const progress = [
      { lesson_id: 'l1', completed_at: new Date().toISOString(), score: 90 },
      { lesson_id: 'l2', completed_at: new Date().toISOString(), score: 85 },
    ];

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data: [], error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data: profiles, error: null }),
        };
      }
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data: progress, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      };
    });

    await act(async () => {
      render(<RankingModal isOpen={true} onClose={vi.fn()} />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('Alice Souza')).toBeInTheDocument();
        expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
