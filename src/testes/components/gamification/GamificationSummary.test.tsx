import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GamificationSummary } from '@/components/gamification/GamificationSummary';

describe('GamificationSummary', () => {
  const defaultProps = {
    level: 5,
    xp: 1200,
    streak: 7,
    badgesCount: 3,
  };

  it('renderiza o nível corretamente', () => {
    render(<GamificationSummary {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Nível')).toBeInTheDocument();
  });

  it('renderiza o XP total', () => {
    render(<GamificationSummary {...defaultProps} />);
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('Total XP')).toBeInTheDocument();
  });

  it('renderiza a sequência com "dias"', () => {
    render(<GamificationSummary {...defaultProps} />);
    expect(screen.getByText('7 dias')).toBeInTheDocument();
    expect(screen.getByText('Sequência')).toBeInTheDocument();
  });

  it('renderiza a contagem de conquistas', () => {
    render(<GamificationSummary {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Conquistas')).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(<GamificationSummary {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renderiza 4 cards de estatísticas', () => {
    const { container } = render(<GamificationSummary {...defaultProps} />);
    const cards = container.querySelectorAll('[class*="Card"]');
    // Should have at least 4 stat cards in the grid
    expect(container.firstChild?.childNodes.length).toBe(4);
  });
});
