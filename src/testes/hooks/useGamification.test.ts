import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGamification, setGamificationNotificationCallback } from '@/hooks/useGamification';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

const mockNotify = vi.fn();

const { mockFrom } = vi.hoisted(() => {
  const createChain = (data: any, singleData: any = data) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: singleData, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: singleData, error: null }),
      then: (resolve: any) => resolve({ data, error: null }),
    };
    return chain;
  };

  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case 'user_gamification':
        return createChain(
          [{ total_xp: 100, current_level: 1, current_streak: 2, longest_streak: 5, total_points: 100, last_activity_date: '2023-01-01' }],
          { total_xp: 100, current_level: 1, current_streak: 2, longest_streak: 5, total_points: 100, last_activity_date: '2023-01-01' }
        );
      case 'user_badges':
        return createChain([
          { badge_id: 'b1', badges: { id: 'b1', name: 'Badge 1', description: 'D1', badge_type: 'bronze', icon_name: 'icon', requirement_type: 'lessons_completed', requirement_value: 1 } }
        ]);
      case 'badges':
        return createChain([
          { id: 'b1', name: 'Badge 1', requirement_type: 'lessons_completed', requirement_value: 1 },
          { id: 'b2', name: 'Badge 2', requirement_type: 'streak_days', requirement_value: 3 }
        ]);
      case 'user_progress':
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({ count: 5, error: null }),
        };
      case 'xp_transactions':
        return createChain([]);
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

describe('useGamification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGamificationNotificationCallback(mockNotify);
  });

  it('não carrega dados se userId for undefined', () => {
    const { result } = renderHook(() => useGamification(undefined));
    expect(result.current.loading).toBe(true);
    expect(result.current.gamificationData).toBeNull();
  });

  it('carrega dados de gamificação e badges ao montar', async () => {
    const { result } = renderHook(() => useGamification('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.gamificationData).toEqual({
      total_xp: 100,
      current_level: 1,
      current_streak: 2,
      longest_streak: 5,
      total_points: 100,
      last_activity_date: '2023-01-01',
    });

    expect(result.current.userBadges).toHaveLength(1);
    expect(result.current.userBadges[0].name).toBe('Badge 1');
  });

  it('concede XP corretamente e notifica', async () => {
    const { result } = renderHook(() => useGamification('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.awardXP(50, 'Completou lição');
    });

    expect(result.current.gamificationData?.total_xp).toBe(150);
    expect(result.current.gamificationData?.current_level).toBe(2);

    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
      title: '+50 XP',
      type: 'success',
    }));

    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
      title: '🎉 Nível 2!',
      type: 'achievement',
    }));
  });

  it('atualiza a sequência (streak) corretamente', async () => {
    const { result } = renderHook(() => useGamification('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateStreak();
    });

    expect(result.current.gamificationData?.current_streak).toBe(1);
  });
});
