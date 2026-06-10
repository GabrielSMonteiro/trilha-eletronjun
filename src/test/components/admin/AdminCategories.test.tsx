import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminCategories } from '@/components/admin/AdminCategories';
import { supabase } from '@/integrations/supabase/client';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-Plus" />,
  Pencil: () => <span data-testid="icon-Pencil" />,
  Trash2: () => <span data-testid="icon-Trash2" />,
  Folder: () => <span data-testid="icon-Folder" />,
  X: () => <span data-testid="icon-X" />,
}));

const { mockFrom, mockInsert, mockUpdate, mockDelete } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();

  const createChain = (data: any, singleData: any = null) => {
    const chain: any = {
      select: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      order: vi.fn(() => Promise.resolve({ data, error: null })),
      single: vi.fn(() => Promise.resolve({ data: singleData, error: null })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
    };
    
    chain.eq = vi.fn((field, val) => {
      if (field === 'category_id') {
        if (val === 'cat-1') return Promise.resolve({ data: [{ id: 'lesson-1' }], error: null });
        return Promise.resolve({ data: [], error: null });
      }
      if (field === 'id') {
        return Promise.resolve({ data: null, error: null });
      }
      return chain;
    });

    return chain;
  };

  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case 'categories':
        
        return createChain([
          { id: 'cat-1', display_name: 'Categoria 1', name: 'cat1', description: 'Desc 1' },
          { id: 'cat-2', display_name: 'Categoria 2', name: 'cat2', description: 'Desc 2' },
        ], null);
      case 'lessons':
        return createChain([]);
      default:
        return createChain([]);
    }
  });

  return { mockFrom, mockInsert, mockUpdate, mockDelete };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('AdminCategories Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(<AdminCategories />);

  it('renders and loads categories', async () => {
    await act(async () => renderComponent());

    await waitFor(() => {
      expect(screen.getByText('Categoria 1')).toBeInTheDocument();
      expect(screen.getByText('Categoria 2')).toBeInTheDocument();
      
      expect(screen.getByText('1 lições')).toBeInTheDocument();
      expect(screen.getByText('0 lições')).toBeInTheDocument();
    });
  });

  it('opens create category dialog and submits', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const newBtn = screen.getByRole('button', { name: /Nova Categoria/i });
    await user.click(newBtn);

    expect(screen.getByText('Crie uma nova categoria para organizar as lições')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nome \(slug\)/i);
    const displayNameInput = screen.getByLabelText(/Nome de Exibição/i);
    
    await user.type(nameInput, 'new-category');
    await user.type(displayNameInput, 'New Category');

    const submitBtn = screen.getByRole('button', { name: 'Criar' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sucesso' }));
    });
  });

  it('opens edit dialog and updates', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Categoria 1')).toBeInTheDocument());

    const editButtons = screen.getAllByTestId('icon-Pencil');
    await user.click(editButtons[0].closest('button')!);

    const nameInput = screen.getByLabelText(/Nome \(slug\)/i);
    expect(nameInput).toHaveValue('cat1');

    await user.clear(nameInput);
    await user.type(nameInput, 'cat-1-updated');

    const submitBtn = screen.getByRole('button', { name: 'Atualizar' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sucesso' }));
    });
  });

  it('deletes a category when confirmed', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Categoria 2')).toBeInTheDocument());

    
    
    const deleteButtons = screen.getAllByTestId('icon-Trash2');
    await user.click(deleteButtons[1].closest('button')!); 

    
    expect(screen.getByText(/Tem certeza que deseja excluir a categoria/i)).toBeInTheDocument();
    
    const confirmBtn = screen.getByRole('button', { name: 'Excluir' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sucesso' }));
    });
  });

  it('prevents deleting a category with lessons', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Categoria 1')).toBeInTheDocument());

    
    const deleteButtons = screen.getAllByTestId('icon-Trash2');
    await user.click(deleteButtons[0].closest('button')!);

    
    expect(screen.getByText(/não pode ser excluída/i)).toBeInTheDocument();
    
    const confirmBtn = screen.getByRole('button', { name: 'Excluir' });
    expect(confirmBtn).toBeDisabled();
  });

  it('renderiza o estado vazio quando não há categorias', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any));

    await act(async () => renderComponent());
    
    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria encontrada')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Criar Primeira Categoria/i })).toBeInTheDocument();
    });
  });

  it('mostra erro se loadCategories falhar', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Db Error') })
    } as any));

    await act(async () => renderComponent());
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Erro' }));
      expect(consoleSpy).toHaveBeenCalledWith('Error loading categories:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('mostra erro ao tentar criar categoria com nome (slug) já existente', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const newBtn = screen.getByRole('button', { name: /Nova Categoria/i });
    await user.click(newBtn);

    const nameInput = screen.getByLabelText(/Nome \(slug\)/i);
    const displayNameInput = screen.getByLabelText(/Nome de Exibição/i);
    
    await user.type(nameInput, 'cat1'); // 'cat1' já existe no mock principal
    await user.type(displayNameInput, 'Cat Existente');

    // Mockar verificação de existência
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { name: 'cat1' }, error: null })
    } as any));

    const submitBtn = screen.getByRole('button', { name: 'Criar' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Já existe uma categoria com este nome' }));
    });
  });

  it('mostra erro ao falhar na criação (db error)', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const newBtn = screen.getByRole('button', { name: /Nova Categoria/i });
    await user.click(newBtn);

    await user.type(screen.getByLabelText(/Nome \(slug\)/i), 'new-cat');
    await user.type(screen.getByLabelText(/Nome de Exibição/i), 'New');

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any)).mockImplementationOnce(() => ({
      insert: vi.fn().mockResolvedValue({ error: new Error('Insert Error') })
    } as any));

    const submitBtn = screen.getByRole('button', { name: 'Criar' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Erro ao criar categoria' }));
    });
  });

  it('mostra erro ao tentar atualizar categoria para um nome já existente', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Categoria 1')).toBeInTheDocument());

    const editButtons = screen.getAllByTestId('icon-Pencil');
    await user.click(editButtons[0].closest('button')!);

    const nameInput = screen.getByLabelText(/Nome \(slug\)/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'cat2'); // tenta mudar para cat2 que já existe

    // Mockar verificação de existência
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { name: 'cat2' }, error: null })
    } as any));

    const submitBtn = screen.getByRole('button', { name: 'Atualizar' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Já existe uma categoria com este nome' }));
    });
  });

  it('mostra erro se exclusão falhar no banco', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Categoria 2')).toBeInTheDocument());
    
    // Categoria 2 não tem lições no mock (id = cat-2)
    const deleteButtons = screen.getAllByTestId('icon-Trash2');
    await user.click(deleteButtons[1].closest('button')!); 

    // Mockar falha no delete
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    } as any));
    
    const confirmBtn = screen.getByRole('button', { name: 'Excluir' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Erro ao excluir categoria' }));
    });
  });
});
