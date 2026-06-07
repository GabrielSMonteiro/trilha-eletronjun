import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge tailwind classes properly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');

      expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');

      const isActive = true;
      const isError = false;
      expect(
        cn(
          'base-class',
          isActive && 'active-class',
          isError && 'error-class',
          { 'additional-class': true }
        )
      ).toBe('base-class active-class additional-class');
    });
  });
});
