import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SummaryGenerator } from '@/components/ai/SummaryGenerator';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('SummaryGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o formulário corretamente', () => {
    render(<SummaryGenerator />);
    expect(screen.getByRole('button', { name: /Gerar/i })).toBeInTheDocument();
  });

  it('gera resumo com sucesso', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { summary: 'Este é um resumo gerado pela IA.' },
      error: null
    });
    
    render(<SummaryGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'O React é uma biblioteca JavaScript para criar interfaces de usuário.' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Este é um resumo gerado pela IA.')).toBeInTheDocument();
    });
  });
});
