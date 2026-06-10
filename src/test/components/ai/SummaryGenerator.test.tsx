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
  it('mostra erro se o texto estiver vazio', () => {
    render(<SummaryGenerator />);
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Resumo/i });
    fireEvent.click(submitBtn);
    
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('mostra erro se a função do supabase falhar', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: new Error('Network error')
    });

    render(<SummaryGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Resumo/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });

  it('mostra erro customizado se data.error existir', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { error: 'Custom generation error' },
      error: null
    });

    render(<SummaryGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Resumo/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });

  it('permite copiar o resumo para a área de transferência', async () => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn()
      }
    });

    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { summary: 'Resumo copiado.' },
      error: null
    });

    render(<SummaryGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Resumo/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Resumo copiado.')).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /Copiar/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Resumo copiado.');
    
    await waitFor(() => {
      expect(screen.getByText('Copiado')).toBeInTheDocument();
    });
  });
});
