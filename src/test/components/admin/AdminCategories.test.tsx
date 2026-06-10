import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminCategories } from '@/components/admin/AdminCategories';

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
});
