import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SharedLinks } from '@/components/cafe/SharedLinks';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  }
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

const mockLinks = [
  { id: '1', title: 'Doc Oficial', url: 'https://react.dev', link_type: 'other', description: 'Docs', user_id: 'u1', created_at: '2024-01-01' },
  { id: '2', title: 'Video Aula', url: 'https://youtube.com', link_type: 'youtube', description: null, user_id: 'u1', created_at: '2024-01-02' },
];

const buildFromChain = (overrides: Record<string, any> = {}) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: mockLinks, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
    ...overrides
  };
  return chain;
};

describe('SharedLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockImplementation(() => buildFromChain());
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'test-user' } } });
  });

  it('renderiza o cabeçalho e botão Adicionar', async () => {
    render(<SharedLinks />);
    expect(screen.getByText('Links de Estudo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adicionar/i })).toBeInTheDocument();
  });

  it('carrega e exibe links', async () => {
    render(<SharedLinks />);
    await waitFor(() => {
      expect(screen.getByText('Doc Oficial')).toBeInTheDocument();
      expect(screen.getByText('Video Aula')).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando não há links', async () => {
    (supabase.from as any).mockImplementation(() => buildFromChain({
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    }));
    render(<SharedLinks />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum link compartilhado ainda')).toBeInTheDocument();
    });
  });

  it('abre o dialog ao clicar em Adicionar', async () => {
    render(<SharedLinks />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
    await waitFor(() => {
      expect(screen.getByText('Novo Link')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Título')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('URL')).toBeInTheDocument();
    });
  });

  it('valida campos obrigatórios antes de inserir', async () => {
    const { toast } = await import('sonner');
    render(<SharedLinks />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
    await waitFor(() => {
      expect(screen.getByText('Novo Link')).toBeInTheDocument();
    });
    // Clica em Adicionar Link sem preencher
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Link/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Preencha título e URL');
    });
  });

  it('insere novo link com sucesso', async () => {
    const { toast } = await import('sonner');
    render(<SharedLinks />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'Meu Link' } });
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Link/i }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('shared_links');
      expect(toast.success).toHaveBeenCalledWith('Link adicionado!');
    });
  });

  it('exibe erro quando insert falha', async () => {
    const { toast } = await import('sonner');
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'shared_links') {
        return buildFromChain({ insert: vi.fn().mockResolvedValue({ error: new Error('fail') }) });
      }
      return buildFromChain();
    });

    render(<SharedLinks />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'Meu Link' } });
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao adicionar link');
    });
  });

  it('exibe links com ícone de youtube corretamente', async () => {
    render(<SharedLinks />);
    await waitFor(() => {
      expect(screen.getByText('Video Aula')).toBeInTheDocument();
    });
    // Verifica que link com type youtube tem link externo
    const links = screen.getAllByRole('link', { name: /Abrir/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('exibe erro ao carregar links', async () => {
    const { toast } = await import('sonner');
    (supabase.from as any).mockImplementation(() => buildFromChain({
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    }));
    render(<SharedLinks />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao carregar links');
    });
  });
});
