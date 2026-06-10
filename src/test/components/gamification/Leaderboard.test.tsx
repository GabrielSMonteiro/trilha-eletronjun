import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Leaderboard } from '@/components/gamification/Leaderboard';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            user_id: 'user1',
            display_name: 'Usuário 1',
            avatar_url: '',
            total_xp: 5000,
            rank: 1,
            lessons_completed: 10,
            badges_earned: 5,
            current_level: 5,
            current_streak: 3,
          },
          {
            user_id: 'user2',
            display_name: 'Usuário 2',
            avatar_url: '',
            total_xp: 3000,
            rank: 2,
            lessons_completed: 6,
            badges_earned: 3,
            current_level: 3,
            current_streak: 1,
          },
          {
            user_id: 'current-user-id',
            display_name: 'Eu',
            avatar_url: '',
            total_xp: 1500,
            rank: 4,
            lessons_completed: 2,
            badges_earned: 1,
            current_level: 2,
            current_streak: 0,
          }
        ],
        error: null
      })
    }))
  }
}));

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o título Ranking Global', async () => {
    render(<Leaderboard userId="current-user-id" />);
    
    expect(screen.getByText('Ranking Global')).toBeInTheDocument();
  });

  it('carrega e exibe os usuários no ranking', async () => {
    render(<Leaderboard userId="current-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Usuário 1')).toBeInTheDocument();
      expect(screen.getByText('5000 XP')).toBeInTheDocument();

      expect(screen.getByText('Usuário 2')).toBeInTheDocument();
      expect(screen.getByText('3000 XP')).toBeInTheDocument();
    });
  });

  it('destaca o usuário atual', async () => {
    render(<Leaderboard userId="current-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Eu')).toBeInTheDocument();
    });

    
    const voceElements = screen.queryAllByText('Você');
    expect(voceElements.length).toBeGreaterThan(0);
  });

  it('exibe o ranking para o quarto lugar', async () => {
    render(<Leaderboard userId="current-user-id" />);

    await waitFor(() => {
      expect(screen.getByText('Usuário 1')).toBeInTheDocument();
    });

    
    expect(screen.getByText('#4')).toBeInTheDocument();
  });
});
