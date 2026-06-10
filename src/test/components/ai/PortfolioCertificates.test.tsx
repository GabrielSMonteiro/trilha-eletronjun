import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortfolioCertificates } from '@/components/ai/PortfolioCertificates';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
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
});
