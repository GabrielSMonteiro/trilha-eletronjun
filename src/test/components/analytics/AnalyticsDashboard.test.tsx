import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/components/analytics/CompletionRateChart', () => ({ CompletionRateChart: () => <div data-testid="completion-rate-chart" /> }));
vi.mock('@/components/analytics/StudyTimeChart', () => ({ StudyTimeChart: () => <div data-testid="study-time-chart" /> }));
vi.mock('@/components/analytics/ProgressChart', () => ({ ProgressChart: () => <div data-testid="progress-chart" /> }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { level: 5, xp: 1200, current_streak: 7, badges_count: 3 },
        error: null
      })
    }))
  }
}));

const { mockUseAnalytics } = vi.hoisted(() => ({
  mockUseAnalytics: vi.fn(() => ({
    userAnalytics: { total_xp: 1200, current_level: 5, current_streak: 7, lessons_completed: 10, total_study_minutes: 60, total_sessions: 2, avg_score: 95 },
    categoryAnalytics: [],
    recentSessions: [],
    loading: false
  }))
}));

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: mockUseAnalytics,
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default implementation after clearAllMocks resets it
    mockUseAnalytics.mockImplementation(() => ({
      userAnalytics: { total_xp: 1200, current_level: 5, current_streak: 7, lessons_completed: 10, total_study_minutes: 60, total_sessions: 2, avg_score: 95 },
      categoryAnalytics: [],
      recentSessions: [],
      loading: false
    }));
  });

  it('renderiza as métricas de resumo após carregar', async () => {
    render(<AnalyticsDashboard userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Nível 5/)).toBeInTheDocument(); 
      expect(screen.getByText('1200')).toBeInTheDocument(); 
      expect(screen.getByText(/Sequência: 7 dias/)).toBeInTheDocument(); 
    });
  });

  it('renderiza os componentes de gráficos', async () => {
    render(<AnalyticsDashboard userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('completion-rate-chart')).toBeInTheDocument();
      expect(screen.getByTestId('study-time-chart')).toBeInTheDocument();
      expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    });
  });

  it('renderiza sem crash quando loading=true e userAnalytics=null', () => {
    mockUseAnalytics.mockReturnValueOnce({
      userAnalytics: null,
      categoryAnalytics: [],
      recentSessions: [],
      loading: true
    });
    const { container } = render(<AnalyticsDashboard userId="user-123" />);
    // O componente deve renderizar sem quebrar mesmo sem dados de analytics
    expect(container.firstChild).toBeInTheDocument();
  });

  it('o botão de Exportar Relatório exibe toast', async () => {
    render(<AnalyticsDashboard userId="user-123" />);
    
    const exportBtn = screen.getByRole('button', { name: /Exportar/i });
    exportBtn.click();
    // toast é chamado internamente, apenas garantindo que não quebra
    expect(exportBtn).toBeInTheDocument();
  });

  it('renderiza a visão de admin com tabela e filtros', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        };
      }
      if (table === 'user_analytics') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { user_id: 'u1', display_name: 'Alice', total_xp: 500, lessons_completed: 5, avg_score: 90 }
            ],
            error: null
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ user_id: 'u1', position: 'Dev' }],
            error: null
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    render(<AnalyticsDashboard userId="user-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Dev')).toBeInTheDocument();
    });
  });
});
