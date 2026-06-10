import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table) => {
      switch (table) {
        case 'user_roles':
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ user_id: 'admin1' }], error: null })
          };
        case 'profiles':
          return {
            select: vi.fn().mockReturnThis(),
            not: vi.fn().mockResolvedValue({ count: 15, error: null })
          };
        case 'lessons':
          return {
            select: vi.fn().mockResolvedValue({ count: 42, error: null })
          };
        case 'user_progress':
          return {
            select: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: '1',
                  completed_at: new Date().toISOString(),
                  score: 95,
                  profiles: { display_name: 'Gabriel' },
                  lessons: { title: 'React Basics' }
                }
              ],
              error: null
            }),
            gte: vi.fn().mockResolvedValue({
              data: [{ user_id: 'user1' }, { user_id: 'user2' }],
              error: null
            })
          };
        case 'categories':
          return {
            select: vi.fn().mockResolvedValue({ count: 5, error: null })
          };
        case 'category_progress':
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { category_name: 'Frontend', total_lessons: 10, total_completions: 8 }
              ],
              error: null
            })
          };
        default:
          return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
    })
  }
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os estatísticas após o loading', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument(); 
      expect(screen.getByText('42')).toBeInTheDocument(); 
      expect(screen.getByText('2')).toBeInTheDocument(); 
    });
    
    expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
  });

  it('renderiza atividade recente', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });

  it('renderiza estatísticas de categorias', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Frontend')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument(); 
      expect(screen.getByText('8 conclusões de 10 lições')).toBeInTheDocument();
    });
  });
});
