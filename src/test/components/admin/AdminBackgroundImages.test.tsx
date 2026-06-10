import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminBackgroundImages } from '@/components/admin/AdminBackgroundImages';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            image_url: 'https://mock.com/bg-1.jpg',
            title: 'Fundo 1',
            display_order: 0,
            is_active: true,
            created_at: '2024-01-01',
          },
          {
            id: '2',
            image_url: 'https://mock.com/bg-2.png',
            title: 'Fundo 2',
            display_order: 1,
            is_active: true,
            created_at: '2024-01-02',
          }
        ],
        error: null
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://mock.com/${path}` }
        })),
      }))
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user' } } })
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('AdminBackgroundImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e exibe as imagens', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it('exibe o título da página', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getByText('Imagens de Fundo')).toBeInTheDocument();
    });
  });

  it('exibe botões de remoção para cada imagem', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2);
    });

    
    const allButtons = screen.getAllByRole('button');
    const deleteBtns = allButtons.filter(b => b.className.includes('destructive'));
    expect(deleteBtns.length).toBe(2);
  });

  it('permite alternar a ordem (move up/down) e deletar', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(2);
    });

    const upButtons = screen.getAllByText('↑');
    const downButtons = screen.getAllByText('↓');
    
    
    fireEvent.click(upButtons[1]);
    
    
    fireEvent.click(downButtons[0]);

    
    const switches = screen.getAllByRole('switch');
    if (switches.length > 0) {
      fireEvent.click(switches[0]);
    }

    
    const allButtons = screen.getAllByRole('button');
    const deleteBtns = allButtons.filter(b => b.className.includes('destructive'));
    fireEvent.click(deleteBtns[0]);
  });
});

