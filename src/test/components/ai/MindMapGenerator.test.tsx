import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MindMapGenerator } from '@/components/ai/MindMapGenerator';

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

describe('MindMapGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o formulário', () => {
    render(<MindMapGenerator />);
    expect(screen.getByRole('button', { name: /Gerar/i })).toBeInTheDocument();
  });

  it('gera mapa mental com sucesso', async () => {
    
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        mindmap: {
          title: 'Mapa Mental de Teste',
          children: [
            { title: 'Subtópico 1', children: [] },
            { title: 'Subtópico 2', children: [] }
          ]
        }
      },
      error: null
    });

    render(<MindMapGenerator />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Tema de teste' } });
    
    const submitBtn = screen.getByRole('button', { name: /Gerar/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Mapa Mental de Teste')).toBeInTheDocument();
      expect(screen.getByText('Subtópico 1')).toBeInTheDocument();
    });
  });
});
