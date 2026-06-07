import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reducer } from '@/hooks/use-toast';

const makeToast = (id: string) => ({
  id,
  title: `Toast ${id}`,
  open: true,
  onOpenChange: vi.fn(),
});

describe('use-toast reducer', () => {
  const emptyState = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('adds a toast to an empty list', () => {
      const toast = makeToast('1');
      const state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe('1');
    });

    it('respects TOAST_LIMIT (1) — older toast is dropped', () => {
      const first = makeToast('1');
      const second = makeToast('2');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast: first });
      state = reducer(state, { type: 'ADD_TOAST', toast: second });
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('updates an existing toast by id', () => {
      const toast = makeToast('1');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      state = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated title' },
      });
      expect(state.toasts[0].title).toBe('Updated title');
    });

    it('does not mutate toasts with other ids', () => {
      const toast = makeToast('1');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      state = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '999', title: 'Should not appear' },
      });
      expect(state.toasts[0].title).toBe('Toast 1');
    });
  });

  describe('DISMISS_TOAST', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('sets open=false for a specific toast', () => {
      const toast = makeToast('1');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      state = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
      expect(state.toasts[0].open).toBe(false);
    });

    it('sets open=false for all toasts when toastId is undefined', () => {
      const toast = makeToast('1');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      state = reducer(state, { type: 'DISMISS_TOAST' });
      state.toasts.forEach((t) => expect(t.open).toBe(false));
    });
  });

  describe('REMOVE_TOAST', () => {
    it('removes a toast by id', () => {
      const toast = makeToast('1');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      state = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
      expect(state.toasts).toHaveLength(0);
    });

    it('clears all toasts when toastId is undefined', () => {
      const toast = makeToast('1');
      let state = reducer(emptyState, { type: 'ADD_TOAST', toast });
      state = reducer(state, { type: 'REMOVE_TOAST' });
      expect(state.toasts).toHaveLength(0);
    });

    it('leaves unrelated toasts untouched', () => {
      const toast1 = makeToast('1');
      const stateWithOne = reducer(emptyState, { type: 'ADD_TOAST', toast: toast1 });
      const after = reducer(stateWithOne, { type: 'REMOVE_TOAST', toastId: '999' });
      expect(after.toasts).toHaveLength(1);
    });
  });
});
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from '@/hooks/use-toast';

describe('useToast hook', () => {
  it('returns a toast function and initial empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeInstanceOf(Function);
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('adds a toast when toast() is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Hello', description: 'World' });
    });

    expect(result.current.toasts.length).toBeGreaterThan(0);
    expect(result.current.toasts[0].title).toBe('Hello');
  });

  it('dismiss() closes the toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = toast({ title: 'Dismiss me' });
      toastId = t.id;
    });

    act(() => {
      result.current.dismiss(toastId!);
    });

    const found = result.current.toasts.find((t) => t.id === toastId);
    expect(found?.open).toBe(false);
  });

  it('update() returned from toast() updates that toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      const t = toast({ title: 'Initial' });
      t.update({ id: t.id, title: 'Updated' });
    });

    expect(result.current.toasts[0].title).toBe('Updated');
  });
});
