import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminBackgroundImages } from '@/components/admin/AdminBackgroundImages';
import { supabase } from '@/integrations/supabase/client';

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

  it('lida com erros ao carregar imagens', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Load error') }),
    } as any));

    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma imagem configurada.')).toBeInTheDocument();
    });
  });

  it('valida tipo e tamanho de arquivo no upload', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getByText('Imagens Configurada', { exact: false })).toBeInTheDocument();
    });

    // Encontra o input (ele é hidden, então pegamos via querySelector ou data-testid se existisse. Aqui vamos pegar pelo tipo e mockar o File)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Arquivo não-imagem
    const txtFile = new File(['text'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [txtFile] } });
    expect(supabase.storage.from).not.toHaveBeenCalled(); // Retorna antes de fazer upload

    // Arquivo maior que 5MB (10MB)
    const largeFile = new File(['a'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('realiza upload de arquivo com sucesso', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getByText('Imagens Configurada', { exact: false })).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(supabase.storage.from).toHaveBeenCalledWith('auth-backgrounds');
    });
  });

  it('lida com falha no upload', async () => {
    vi.mocked(supabase.storage.from).mockImplementationOnce(() => ({
      upload: vi.fn().mockResolvedValue({ error: new Error('Upload error') })
    } as any));

    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getByText('Imagens Configurada', { exact: false })).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(supabase.storage.from).toHaveBeenCalledWith('auth-backgrounds');
    });
  });

  it('tenta mover itens para fora dos limites e atualiza status', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(2);
    });

    const upButtons = screen.getAllByText('↑');
    const downButtons = screen.getAllByText('↓');
    
    // Tenta mover o primeiro pra cima (deve estar desabilitado mas por garantia)
    expect(upButtons[0]).toBeDisabled();
    fireEvent.click(upButtons[0]);

    // Tenta mover o último pra baixo
    expect(downButtons[1]).toBeDisabled();
    fireEvent.click(downButtons[1]);
    
    // Atualizar status para dar trigger no toast de erro
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error('Update error') })
    } as any));
    
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    
    // Wait for the update to happen (nothing really observable except no crashes and toast is called in implementation)
  });

  it('lida com fallback de imagem no onError', async () => {
    render(<AdminBackgroundImages />);

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(2);
    });

    const img = screen.getAllByRole('img')[0];
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/placeholder.svg');
  });
});

