import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';

vi.mock('lucide-react', () => ({
  Trophy: () => <span data-testid="trophy-icon" />,
  Zap: () => <span data-testid="zap-icon" />,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" data-value={value} role="progressbar" />
  ),
}));

describe('XPProgressBar', () => {
  it('renderiza o nível atual e XP total', () => {
    render(<XPProgressBar currentXP={150} currentLevel={2} />);

    expect(screen.getByText('Nível 2')).toBeInTheDocument();
    expect(screen.getByText('150 XP Total')).toBeInTheDocument();
  });

  it('calcula corretamente o XP dentro do nível e para o próximo', () => {
    render(<XPProgressBar currentXP={150} currentLevel={2} />);

    expect(screen.getByText('50/300 XP')).toBeInTheDocument();
    expect(screen.getByText('250 XP para o próximo nível')).toBeInTheDocument();
  });

  it('renderiza a barra de progresso com o valor correto', () => {
    render(<XPProgressBar currentXP={150} currentLevel={2} />);
    const progressBar = screen.getByTestId('progress-bar');
    const value = parseFloat(progressBar.getAttribute('data-value') || '0');
    expect(value).toBeCloseTo(16.67, 1);
  });

  it('cap o progresso em 100% quando no máximo do nível', () => {
    render(<XPProgressBar currentXP={200} currentLevel={1} />);
    const progressBar = screen.getByTestId('progress-bar');
    expect(parseFloat(progressBar.getAttribute('data-value') || '0')).toBe(100);
  });

  it('aplica className customizado', () => {
    const { container } = render(
      <XPProgressBar currentXP={100} currentLevel={1} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
