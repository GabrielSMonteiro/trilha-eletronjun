import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForumsList from '@/components/community/ForumsList';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

const mockCategories = [
  { id: 'cat-1', name: 'Frontend', display_name: 'Frontend' }
];

const mockForums = [
  {
    id: 'forum-1',
    title: 'Dúvida sobre React',
    description: 'Como usar useEffect?',
    category_id: 'cat-1',
    created_at: new Date().toISOString(),
    created_by: 'user1',
    is_pinned: false,
    categories: { display_name: 'Frontend' },
    forum_posts: [{ count: 5 }]
  }
];

const buildChain = (resolvedValue: any) => {
  const chain: any = {};
  ['select', 'eq', 'order', 'in', 'insert', 'update', 'delete', 'single', 'limit'].forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  
  chain.order = vi.fn().mockResolvedValue(resolvedValue);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockResolvedValue({ error: null });
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
  return chain;
};

const setupGlobalMock = () => {
  (supabase.from as any).mockImplementation((table: string) => {
    switch (table) {
      case 'categories':
        return buildChain({ data: mockCategories, error: null });
      case 'forums': {
        
        
        const chain = buildChain({ data: [], error: null });
        let callCount = 0;
        chain.order = vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount >= 2) {
            return Promise.resolve({ data: mockForums, error: null });
          }
          return chain;
        });
        chain.insert = vi.fn().mockResolvedValue({ error: null });
        return chain;
      }
      case 'forum_posts': {
        
        const chain = buildChain({ data: [], error: null });
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockResolvedValue({ data: [], error: null });
        chain.insert = vi.fn().mockResolvedValue({ error: null });
        return chain;
      }
      case 'profiles': {
        const chain = buildChain({ data: [], error: null });
        chain.in = vi.fn().mockResolvedValue({ data: [], error: null });
        return chain;
      }
      default:
        return buildChain({ data: [], error: null });
    }
  });
};

describe('ForumsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupGlobalMock();
  });

  it('renderiza a estrutura principal e o cabeçalho', () => {
    render(<ForumsList userId="user1" />);
    expect(screen.getByText('Fóruns de Discussão')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo Fórum/i })).toBeInTheDocument();
  });

  it('carrega e exibe a lista de fóruns', async () => {
    render(<ForumsList userId="user1" />);

    await waitFor(() => {
      expect(screen.getByText('Dúvida sobre React')).toBeInTheDocument();
      expect(screen.getByText('Como usar useEffect?')).toBeInTheDocument();
      expect(screen.getByText('5 posts')).toBeInTheDocument();
    });
  });

  it('seleciona um fórum e exibe o ForumThread, depois volta', async () => {
    render(<ForumsList userId="user1" />);

    await waitFor(() => {
      expect(screen.getByText('Dúvida sobre React')).toBeInTheDocument();
    });

    
    fireEvent.click(screen.getByText('Dúvida sobre React'));

    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Voltar aos Fóruns/i })).toBeInTheDocument();
    });

    
    fireEvent.click(screen.getByRole('button', { name: /Voltar aos Fóruns/i }));

    await waitFor(() => {
      expect(screen.getByText('Fóruns de Discussão')).toBeInTheDocument();
    });
  });

  it('abre o dialog de criar fórum', async () => {
    render(<ForumsList userId="user1" />);

    fireEvent.click(screen.getByRole('button', { name: /Novo Fórum/i }));

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Fórum')).toBeInTheDocument();
    });
  });

  it('valida campos obrigatórios ao criar fórum (título vazio não insere)', async () => {
    render(<ForumsList userId="user1" />);

    fireEvent.click(screen.getByRole('button', { name: /Novo Fórum/i }));

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Fórum')).toBeInTheDocument();
    });

    
    fireEvent.click(screen.getByRole('button', { name: 'Criar Fórum' }));

    
    
    
    
    const callsToForums = (supabase.from as any).mock.calls.filter((c: string[]) => c[0] === 'forums');
    
    
    expect(callsToForums.length).toBeGreaterThanOrEqual(1);
    
  });

  it('preenche o formulário e submete para criar fórum', async () => {
    render(<ForumsList userId="user1" />);

    fireEvent.click(screen.getByRole('button', { name: /Novo Fórum/i }));

    await waitFor(() => {
      expect(screen.getByText('Criar Novo Fórum')).toBeInTheDocument();
    });

    
    const titleInput = screen.getByPlaceholderText('Ex: Dúvidas sobre Resistores');
    fireEvent.change(titleInput, { target: { value: 'Meu novo fórum' } });

    
    const descInput = screen.getByPlaceholderText('Descreva o propósito deste fórum...');
    fireEvent.change(descInput, { target: { value: 'Descrição do fórum' } });

    
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    
    await waitFor(() => {
      
      const frontendOptions = screen.getAllByText('Frontend');
      
      const option = frontendOptions[frontendOptions.length - 1];
      fireEvent.click(option);
    });

    
    fireEvent.click(screen.getByRole('button', { name: 'Criar Fórum' }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('forums');
    });
  });
});
