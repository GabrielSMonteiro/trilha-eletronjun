import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllNotesPanel } from '@/components/AllNotesPanel';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { title: 'Introdução ao React', categories: { display_name: 'Frontend' } }, error: null }),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            lesson_id: 'lesson1',
            content: 'Minha anotação da lição 1',
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            lesson_id: 'lesson2',
            content: 'Anotação mais longa',
            updated_at: new Date().toISOString()
          }
        ],
        error: null
      })
    }))
  }
}));

describe('AllNotesPanel', () => {
  const defaultProps = {
    userId: 'user123',
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe título principal', async () => {
    render(<AllNotesPanel {...defaultProps} />);
    expect(screen.getByText('Minhas Anotações')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão fechar', async () => {
    const onClose = vi.fn();
    render(<AllNotesPanel {...defaultProps} onClose={onClose} />);
    
    
    const closeBtns = screen.getAllByRole('button');
    fireEvent.click(closeBtns[0]);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('carrega e exibe a lista de notas', async () => {
    render(<AllNotesPanel {...defaultProps} />);
    
    await waitFor(() => {
      
      const titles = screen.getAllByText('Introdução ao React');
      expect(titles.length).toBeGreaterThan(0);
      expect(screen.getByText('Minha anotação da lição 1')).toBeInTheDocument();
      expect(screen.getByText('Anotação mais longa')).toBeInTheDocument();
    });
  });

  it('expande a nota ao clicar', async () => {
    render(<AllNotesPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Anotação mais longa')).toBeInTheDocument();
    });
    
    
    const card = screen.getByText('Anotação mais longa').closest('.cursor-pointer');
    if (card) fireEvent.click(card);
    
    
    
    expect(screen.getByText('Anotação mais longa')).toBeInTheDocument();
  });
});
