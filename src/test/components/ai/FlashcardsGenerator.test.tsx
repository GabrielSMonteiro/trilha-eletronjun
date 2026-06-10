import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardsGenerator } from '@/components/ai/FlashcardsGenerator';

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

describe('FlashcardsGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o formulário corretamente', () => {
    render(<FlashcardsGenerator />);
    
    expect(screen.getByText('Gerar Flashcards Automáticos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gerar/i })).toBeInTheDocument();
  });

  it('gera flashcards com sucesso', async () => {
    
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        flashcards: [
          { front: 'O que é React?', back: 'Uma biblioteca JavaScript.' },
          { front: 'O que é Vitest?', back: 'Um framework de testes.' }
        ]
      },
      error: null
    });

    render(<FlashcardsGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto de teste sobre React e Vitest' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Flashcards/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('O que é React?')).toBeInTheDocument();
    });
    
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it('mostra erro se o texto estiver vazio', () => {
    render(<FlashcardsGenerator />);
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Flashcards/i });
    fireEvent.click(submitBtn);
    
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('mostra erro se a função do supabase falhar', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: new Error('Network error')
    });

    render(<FlashcardsGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Flashcards/i });
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

    render(<FlashcardsGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar Flashcards/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });

  it('permite navegar entre flashcards gerados e virar o cartão', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        flashcards: [
          { front: 'Front 1', back: 'Back 1' },
          { front: 'Front 2', back: 'Back 2' }
        ]
      },
      error: null
    });

    render(<FlashcardsGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Texto' } });
    
    const countInput = screen.getByLabelText(/Número de Flashcards/i);
    fireEvent.change(countInput, { target: { value: '2' } });

    const submitBtn = screen.getByRole('button', { name: /Gerar Flashcards/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Front 1')).toBeInTheDocument();
    });

    // Vira o cartão
    const card = screen.getByText('Front 1').closest('div.relative.cursor-pointer');
    if (card) {
      fireEvent.click(card);
    }
    
    // Navega para o próximo
    const nextBtn = screen.getByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Front 2')).toBeInTheDocument();
    });

    // Navega para o anterior
    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByText('Front 1')).toBeInTheDocument();
    });
  });
});
