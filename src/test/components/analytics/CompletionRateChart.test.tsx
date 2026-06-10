import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompletionRateChart } from '@/components/analytics/CompletionRateChart';

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

  it('exibe a porcentagem corretamente', () => {
    render(<CompletionRateChart completed={30} total={100} />);
    expect(screen.getByText(/30 de 100 lições completadas/i)).toBeInTheDocument();
    expect(screen.getByText(/30%/i)).toBeInTheDocument();
  });

  it('lida com total igual a 0', () => {
    render(<CompletionRateChart completed={0} total={0} />);
    // Não deve quebrar com divisão por zero
    expect(screen.getByText('Taxa de Conclusão')).toBeInTheDocument();
  });

  it('exibe 100% quando tudo está completo', () => {
    render(<CompletionRateChart completed={10} total={10} />);
    expect(screen.getByText(/10 de 10 lições completadas \(100%\)/i)).toBeInTheDocument();
  });
});
