import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  let listeners: any[] = [];
  
  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), 
        removeListener: vi.fn(), 
        addEventListener: vi.fn((event, callback) => {
          if (event === 'change') listeners.push(callback);
        }),
        removeEventListener: vi.fn((event, callback) => {
          if (event === 'change') {
            listeners = listeners.filter(cb => cb !== callback);
          }
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('retorna valor inicial baseado no innerWidth', () => {
    window.innerWidth = 800;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    window.innerWidth = 500;
    const { result: resultMobile } = renderHook(() => useIsMobile());
    expect(resultMobile.current).toBe(true);
  });

  it('atualiza quando ocorre evento change no matchMedia', () => {
    window.innerWidth = 800;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      window.innerWidth = 500;
      listeners.forEach(cb => cb());
    });
    
    expect(result.current).toBe(true);
  });
});
