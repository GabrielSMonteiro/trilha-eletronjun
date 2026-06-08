import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AchievementNotification } from '@/components/gamification/AchievementNotification';

describe('AchievementNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    name: 'Primeiro Passo',
    description: 'Complete sua primeira lição',
    badge_type: 'bronze' as const,
    icon_name: 'Award',
    onClose: vi.fn(),
  };

  it('renderiza nome e descrição', () => {
    render(<AchievementNotification {...defaultProps} />);
    expect(screen.getByText('Primeiro Passo')).toBeInTheDocument();
    expect(screen.getByText('Complete sua primeira lição')).toBeInTheDocument();
  });

  it('renderiza badge_type', () => {
    render(<AchievementNotification {...defaultProps} />);
    expect(screen.getByText('bronze')).toBeInTheDocument();
  });

  it('renderiza label "Nova Conquista!"', () => {
    render(<AchievementNotification {...defaultProps} />);
    expect(screen.getByText(/Nova Conquista/)).toBeInTheDocument();
  });

  it('chama onClose ao clicar no card', () => {
    const onClose = vi.fn();
    render(<AchievementNotification {...defaultProps} onClose={onClose} />);

    const element = screen.getByText('Primeiro Passo');
    fireEvent.click(element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fica visível após 100ms', () => {
    const { container } = render(<AchievementNotification {...defaultProps} />);
    expect(container.firstChild).toHaveClass('translate-x-full');

    act(() => { vi.advanceTimersByTime(150); });
    expect(container.firstChild).toHaveClass('translate-x-0');
  });

  it('desaparece e chama onClose após 5 segundos', () => {
    const onClose = vi.fn();
    const { container } = render(<AchievementNotification {...defaultProps} onClose={onClose} />);

    act(() => { vi.advanceTimersByTime(5100); });
    expect(container.firstChild).toHaveClass('translate-x-full');

    act(() => { vi.advanceTimersByTime(600); });
    expect(onClose).toHaveBeenCalled();
  });

  it('renderiza com badge_type gold', () => {
    render(<AchievementNotification {...defaultProps} badge_type="gold" />);
    expect(screen.getByText('gold')).toBeInTheDocument();
  });

  it('renderiza com badge_type silver', () => {
    render(<AchievementNotification {...defaultProps} badge_type="silver" />);
    expect(screen.getByText('silver')).toBeInTheDocument();
  });

  it('renderiza com badge_type special', () => {
    render(<AchievementNotification {...defaultProps} badge_type="special" />);
    expect(screen.getByText('special')).toBeInTheDocument();
  });
});
