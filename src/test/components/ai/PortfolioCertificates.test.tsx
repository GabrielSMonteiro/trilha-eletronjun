import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortfolioCertificates } from '@/components/ai/PortfolioCertificates';
import { supabase } from '@/integrations/supabase/client';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };
      }
      if (table === 'lessons') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };
      }
      if (table === 'user_badges') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    })
  }
}));

describe('PortfolioCertificates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho após carregar', async () => {
    render(<PortfolioCertificates userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Certificados Conquistados')).toBeInTheDocument();
    });
  });

  it('renderiza o estado vazio quando não há certificados', async () => {
    render(<PortfolioCertificates userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Complete todas as lições de uma trilha para ganhar seu certificado!')).toBeInTheDocument();
    });
  });

  it('renderiza certificados quando há progresso de 100%', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({
            data: [
              {
                score: 95,
                completed_at: '2024-01-01',
                lessons: {
                  category_id: 'cat-1',
                  categories: { display_name: 'Trilha Teste' }
                }
              }
            ],
            error: null
          })
        };
      }
      if (table === 'lessons') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { category_id: 'cat-1', categories: { id: 'cat-1', display_name: 'Trilha Teste' } }
            ],
            error: null
          })
        };
      }
      if (table === 'user_badges') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    render(<PortfolioCertificates userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Trilha Teste')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument(); // avg score
      expect(screen.getByText('1/1')).toBeInTheDocument(); // completed / total
    });
  });

  it('mostra toasts para botões de Baixar e Compartilhar', async () => {
    // Mesma mock de cima
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockResolvedValue({
            data: [
              {
                score: 90,
                completed_at: '2024-01-01',
                lessons: {
                  category_id: 'cat-1',
                  categories: { display_name: 'Trilha Teste' }
                }
              }
            ],
            error: null
          })
        };
      }
      if (table === 'lessons') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              { category_id: 'cat-1' }
            ],
            error: null
          })
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    render(<PortfolioCertificates userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Trilha Teste')).toBeInTheDocument();
    });


    // Clica Baixar
    screen.getByRole('button', { name: /Baixar/i }).click();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Download em desenvolvimento' }));

    // Clica Compartilhar
    screen.getByRole('button', { name: /Compartilhar/i }).click();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Compartilhamento em desenvolvimento' }));
  });

  it('renderiza badges conquistadas', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'user_progress') {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), not: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
      if (table === 'lessons') {
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
      if (table === 'user_badges') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                badge_id: 'badge-1',
                earned_at: '2024-02-01',
                badges: { name: 'Pioneiro', description: 'Primeiro acesso', icon_name: 'Trophy' }
              }
            ],
            error: null
          })
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    render(<PortfolioCertificates userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Pioneiro')).toBeInTheDocument();
      expect(screen.getByText('Primeiro acesso')).toBeInTheDocument();
    });
  });
});
