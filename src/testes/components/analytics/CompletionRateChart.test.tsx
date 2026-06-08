import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompletionRateChart } from '@/components/analytics/CompletionRateChart';

// Recharts pode causar problemas no JSDOM, então mockamos ResponsiveContainer
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => <div />,
    Cell: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />
  };
});

describe('CompletionRateChart', () => {
  it('renderiza o título e o gráfico', () => {
    render(<CompletionRateChart completed={75} total={100} />);
    
    expect(screen.getByText('Taxa de Conclusão')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});
