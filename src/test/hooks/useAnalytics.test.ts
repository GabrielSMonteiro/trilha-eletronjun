import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAnalytics } from '@/hooks/useAnalytics';

const { mockFrom } = vi.hoisted(() => {
  const createChain = (data: any, singleData: any = data) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data: singleData, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  });

  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case 'user_analytics':
        return createChain(
          [],
          {
            lessons_completed: 10,
            total_study_minutes: 120,
            avg_score: 85,
            total_sessions: 5,
            current_streak: 3,
            current_level: 2,
            total_xp: 500,
          }
        );
      case 'category_analytics':
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { category_id: 'c1', category_name: 'Software', total_lessons: 5, unique_students: 10, total_completions: 20, avg_score: 88, total_study_minutes: 300 }
            ],
            error: null,
          }),
        };
      case 'study_sessions':
        return createChain([
          { id: 's1', created_at: '2024-01-01', duration_minutes: 30, completed: true }
        ]);
      default:
        return createChain([]);
    }
  });

  return { mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não carrega dados se userId for undefined', () => {
    const { result } = renderHook(() => useAnalytics(undefined));
    expect(result.current.loading).toBe(true);
    expect(result.current.userAnalytics).toBeNull();
  });

  it('carrega dados de analytics do usuário ao montar', async () => {
    const { result } = renderHook(() => useAnalytics('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.userAnalytics).toMatchObject({
      lessons_completed: 10,
      total_study_minutes: 120,
      avg_score: 85,
      current_level: 2,
      total_xp: 500,
    });
  });

  it('inicia e encerra uma sessão de estudo', async () => {
    
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'session-123' }, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'study_sessions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: mockSingle }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
    });

    const { result } = renderHook(() => useAnalytics('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let sessionId: string | null = null;
    await act(async () => {
      sessionId = await result.current.startSession('lesson-1', 'cat-1');
    });

    expect(sessionId).toBe('session-123');

    await act(async () => {
      await result.current.endSession('session-123', 45);
    });
  });

  it('lida com erros ao carregar analytics', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_analytics') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'User Error', code: 'OTHER' } }),
        };
      }
      if (table === 'category_analytics') {
        return {
          select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Category Error' } }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Sessions Error' } }),
      };
    });

    const { result } = renderHook(() => useAnalytics('user-error'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(consoleError).toHaveBeenCalledWith('Error loading user analytics:', { message: 'User Error', code: 'OTHER' });
    expect(consoleError).toHaveBeenCalledWith('Error loading category analytics:', { message: 'Category Error' });
    expect(consoleError).toHaveBeenCalledWith('Error loading sessions:', { message: 'Sessions Error' });
    
    consoleError.mockRestore();
  });

  it('lida com erros ao iniciar ou encerrar sessão', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFrom.mockImplementation((table: string) => {
      if (table === 'study_sessions') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ error: { message: 'Insert Error' } }) }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'Update Error' } }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
    });

    const { result } = renderHook(() => useAnalytics('user-2'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let sessionId: string | null = null;
    await act(async () => {
      sessionId = await result.current.startSession('lesson-1', 'cat-1');
    });

    expect(sessionId).toBeNull();
    expect(consoleError).toHaveBeenCalledWith('Error starting session:', { message: 'Insert Error' });

    await act(async () => {
      await result.current.endSession('session-123', 45);
    });

    expect(consoleError).toHaveBeenCalledWith('Error ending session:', { message: 'Update Error' });
    
    consoleError.mockRestore();
  });
});
