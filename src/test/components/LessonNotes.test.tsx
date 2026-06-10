import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonNotes } from '@/components/LessonNotes';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'note1', content: 'Minha nota salva' },
          error: null
        }),
        upsert: vi.fn().mockResolvedValue({ error: null })
      }))
    }
  };
});

describe('LessonNotes', () => {
  const defaultProps = {
    lessonId: 'lesson-1',
    userId: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega notas do supabase ao montar', async () => {
    render(<LessonNotes {...defaultProps} embedded={true} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escreva suas anotações aqui...')).toHaveValue('Minha nota salva');
    });
  });

  it('modo embedded renderiza o textarea diretamente', async () => {
    render(<LessonNotes {...defaultProps} embedded={true} />);
    
    expect(screen.getByText('Minhas Anotações')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escreva suas anotações aqui...')).toBeInTheDocument();
    expect(screen.getByText('Salvar Anotações')).toBeInTheDocument();
  });

  it('salva notas ao clicar em salvar', async () => {
    render(<LessonNotes {...defaultProps} embedded={true} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Escreva suas anotações aqui...')).toBeInTheDocument();
    });
    
    const textarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
    fireEvent.change(textarea, { target: { value: 'Nova anotação editada' } });
    
    const saveBtn = screen.getByText('Salvar Anotações');
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('lesson_notes');
    });
  });

  it('modo floating renderiza botão quando isMobile=false', async () => {
    
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
    
    render(<LessonNotes {...defaultProps} embedded={false} />);
    
    
    await waitFor(() => {
      
      expect(screen.getByLabelText('Anotações')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByLabelText('Anotações'));
    
    expect(screen.getByPlaceholderText('Escreva suas anotações aqui...')).toBeInTheDocument();
  });
});
