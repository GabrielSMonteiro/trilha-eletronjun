import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProgressChart } from '@/components/analytics/ProgressChart';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div data-testid="line-chart" />
  };
});

describe('ProgressChart', () => {
  it('renderiza o título e o gráfico de linha', () => {
    const mockData = [{ date: 'Seg', xp: 4000 }];
    render(<ProgressChart data={mockData} />);
    
    expect(screen.getByText('Progresso por Trilha')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
