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
    // The component uses { front, back } not { question, answer }
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
});
