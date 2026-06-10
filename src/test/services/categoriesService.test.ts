import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoriesService } from '@/services/categoriesService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('categoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('returns categories on success', async () => {
      const mockData = [
        { id: '1', name: 'Eletrônica', display_name: 'Eletrônica' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      });

      const result = await categoriesService.getAllCategories();

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockData);
    });

    it('returns empty array when data is null', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      });

      const result = await categoriesService.getAllCategories();
      expect(result).toEqual([]);
    });

    it('throws error on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Database error');

      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      });

      await expect(categoriesService.getAllCategories()).rejects.toThrow('Database error');
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching categories:', mockError);

      consoleSpy.mockRestore();
    });
  });
});
