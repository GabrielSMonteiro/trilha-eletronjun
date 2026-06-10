import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lessonsService } from '@/services/lessonsService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('lessonsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLessonsByCategory', () => {
    it('returns lessons for a specific category', async () => {
      const mockData = [
        { id: '1', title: 'Lição 1', category_id: 'cat-1' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await lessonsService.getLessonsByCategory('eletronica');

      expect(supabase.from).toHaveBeenCalledWith('lessons');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('categories!inner(name)'));
      expect(mockEq).toHaveBeenCalledWith('categories.name', 'eletronica');
      expect(mockOrder).toHaveBeenCalledWith('order_index');
      expect(result).toEqual(mockData);
    });

    it('throws an error if fetching lessons fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Lessons error');

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      await expect(lessonsService.getLessonsByCategory('eletronica')).rejects.toThrow('Lessons error');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching lessons:', mockError);

      consoleSpy.mockRestore();
    });

    it('returns empty array if data is null', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await lessonsService.getLessonsByCategory('eletronica');
      expect(result).toEqual([]);
    });
  });

  describe('getUserProgress', () => {
    it('returns user progress for a given user', async () => {
      const mockData = [
        { lesson_id: '1', completed_at: '2023-01-01', score: 100 },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      const result = await lessonsService.getUserProgress('user-1');

      expect(supabase.from).toHaveBeenCalledWith('user_progress');
      expect(mockSelect).toHaveBeenCalledWith('lesson_id, completed_at, score');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual(mockData);
    });

    it('throws an error if fetching user progress fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Progress error');

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      await expect(lessonsService.getUserProgress('user-1')).rejects.toThrow('Progress error');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user progress:', mockError);

      consoleSpy.mockRestore();
    });

    it('returns empty array if data is null', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      const result = await lessonsService.getUserProgress('user-1');
      expect(result).toEqual([]);
    });
  });
});
