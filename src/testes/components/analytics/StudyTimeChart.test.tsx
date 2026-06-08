import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StudyTimeChart } from '@/components/analytics/StudyTimeChart';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: () => <div data-testid="bar-chart" />
  };
});

describe('StudyTimeChart', () => {
  it('renderiza o título e o gráfico de barras', () => {
    const mockData = [{ day: 'Seg', minutes: 60 }];
    render(<StudyTimeChart data={mockData} />);
    
    expect(screen.getByText('Tempo de Estudo')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
