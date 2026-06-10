import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

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

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    userAnalytics: { total_xp: 1200, current_level: 5, current_streak: 7, lessons_completed: 10, total_study_minutes: 60, total_sessions: 2, avg_score: 95 },
    categoryAnalytics: [],
    recentSessions: [],
    loading: false
  })
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
