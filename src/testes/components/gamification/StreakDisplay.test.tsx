import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';

describe('StreakDisplay', () => {
  it('renderiza currentStreak e longestStreak', () => {
    render(<StreakDisplay currentStreak={7} longestStreak={14} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('exibe labels corretas', () => {
    render(<StreakDisplay currentStreak={5} longestStreak={10} />);
    expect(screen.getByText('Sequência Atual')).toBeInTheDocument();
    expect(screen.getByText('Melhor Sequência')).toBeInTheDocument();
  });

  it('exibe mensagem "Complete uma lição hoje!" quando currentStreak=0', () => {
    render(<StreakDisplay currentStreak={0} longestStreak={5} />);
    expect(screen.getByText('Complete uma lição hoje!')).toBeInTheDocument();
  });

  it('exibe "dias consecutivos" quando currentStreak > 0', () => {
    render(<StreakDisplay currentStreak={3} longestStreak={5} />);
    expect(screen.getByText('dias consecutivos')).toBeInTheDocument();
  });

  it('exibe "Continue estudando!" quando longestStreak=0', () => {
    render(<StreakDisplay currentStreak={0} longestStreak={0} />);
    expect(screen.getByText('Continue estudando!')).toBeInTheDocument();
  });

  it('exibe "recorde pessoal" quando longestStreak > 0', () => {
    render(<StreakDisplay currentStreak={3} longestStreak={10} />);
    expect(screen.getByText('recorde pessoal')).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <StreakDisplay currentStreak={1} longestStreak={1} className="custom" />
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});
