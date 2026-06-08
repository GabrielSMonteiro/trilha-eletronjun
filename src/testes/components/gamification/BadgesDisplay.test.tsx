import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BadgesDisplay } from '@/components/gamification/BadgesDisplay';

const mockBadges = [
  { id: '1', name: 'Primeiro Passo', description: 'Complete sua primeira lição', badge_type: 'bronze' as const, icon_name: 'Award' },
  { id: '2', name: 'Estudioso', description: 'Complete 10 lições', badge_type: 'silver' as const, icon_name: 'BookOpen' },
  { id: '3', name: 'Mestre', description: 'Complete todas as lições', badge_type: 'gold' as const, icon_name: 'Crown' },
];

describe('BadgesDisplay', () => {
  it('renderiza o título com contagem de badges', () => {
    render(<BadgesDisplay badges={mockBadges} />);
    expect(screen.getByText('Conquistas (3)')).toBeInTheDocument();
  });

  it('renderiza os nomes dos badges', () => {
    render(<BadgesDisplay badges={mockBadges} />);
    expect(screen.getByText('Primeiro Passo')).toBeInTheDocument();
    expect(screen.getByText('Estudioso')).toBeInTheDocument();
    expect(screen.getByText('Mestre')).toBeInTheDocument();
  });

  it('renderiza os tipos dos badges', () => {
    render(<BadgesDisplay badges={mockBadges} />);
    expect(screen.getByText('bronze')).toBeInTheDocument();
    expect(screen.getByText('silver')).toBeInTheDocument();
    expect(screen.getByText('gold')).toBeInTheDocument();
  });

  it('exibe estado vazio quando badges=[]', () => {
    render(<BadgesDisplay badges={[]} />);
    expect(screen.getByText('Conquistas (0)')).toBeInTheDocument();
    expect(screen.getByText('Complete lições para desbloquear conquistas!')).toBeInTheDocument();
  });

  it('exibe descrição no tooltip (title)', () => {
    render(<BadgesDisplay badges={mockBadges} />);
    const badge = screen.getByTitle('Complete sua primeira lição');
    expect(badge).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(<BadgesDisplay badges={[]} className="my-badges" />);
    expect(container.firstChild).toHaveClass('my-badges');
  });

  it('renderiza badge do tipo special', () => {
    const specialBadge = [
      { id: '4', name: 'Especial', description: 'Badge especial', badge_type: 'special' as const, icon_name: 'Star' },
    ];
    render(<BadgesDisplay badges={specialBadge} />);
    expect(screen.getByText('Especial')).toBeInTheDocument();
    expect(screen.getByText('special')).toBeInTheDocument();
  });
});
