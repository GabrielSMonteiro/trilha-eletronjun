import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from '@/services/profileService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfileByUserId', () => {
    it('returns profile data on success', async () => {
      const mockData = { id: '1', user_id: 'user-1', display_name: 'Test User' };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await profileService.getProfileByUserId('user-1');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('returns null if PGRST116 error occurs (no rows)', async () => {
      const mockError = { code: 'PGRST116', message: 'No rows' };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await profileService.getProfileByUserId('user-1');
      expect(result).toBeNull();
    });

    it('throws error for other errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = { code: 'OTHER', message: 'Database error' };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await expect(profileService.getProfileByUserId('user-1')).rejects.toEqual(mockError);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile:', mockError);

      consoleSpy.mockRestore();
    });
  });

  describe('updateProfile', () => {
    it('updates profile and returns the updated data', async () => {
      const mockData = { id: '1', user_id: 'user-1', display_name: 'Updated User' };
      const updates = { display_name: 'Updated User' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      const result = await profileService.updateProfile('user-1', updates);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('throws error if update fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Update error');
      const updates = { display_name: 'Updated User' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      await expect(profileService.updateProfile('user-1', updates)).rejects.toThrow('Update error');
      expect(consoleSpy).toHaveBeenCalledWith('Error updating profile:', mockError);

      consoleSpy.mockRestore();
    });
  });
});
