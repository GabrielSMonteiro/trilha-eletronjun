import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoList } from '@/components/cafe/TodoList';

let mockTodos: any[] = [];

const buildChain = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockImplementation(() => Promise.resolve({ data: [...mockTodos], error: null })),
  insert: vi.fn().mockImplementation((item: any) => {
    mockTodos.push({ id: String(Date.now()), ...item, created_at: new Date().toISOString() });
    return Promise.resolve({ error: null });
  }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
});

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

describe('TodoList', () => {
  let supabaseMock: any;

  beforeEach(async () => {
    mockTodos = [];
    vi.clearAllMocks();
    const mod = await import('@/integrations/supabase/client');
    supabaseMock = mod.supabase;
    (supabaseMock.from as any).mockImplementation(() => buildChain());
    (supabaseMock.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'test-user' } } });
  });

  it('renderiza o título TODO e input', () => {
    render(<TodoList />);
    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('add a todo item')).toBeInTheDocument();
  });

  it('exibe mensagem quando não há tarefas', async () => {
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('what to do?')).toBeInTheDocument();
    });
  });

  it('carrega e exibe as tarefas do banco', async () => {
    mockTodos = [
      { id: '1', title: 'Comprar café', completed: false, created_at: '2023-01-01' },
      { id: '2', title: 'Estudar React', completed: true, created_at: '2023-01-02' }
    ];
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Comprar café')).toBeInTheDocument();
      expect(screen.getByText('Estudar React')).toBeInTheDocument();
    });
  });

  it('não adiciona tarefa vazia', async () => {
    const chain = buildChain();
    (supabaseMock.from as any).mockImplementation(() => chain);

    render(<TodoList />);
    await waitFor(() => expect(screen.getByText('what to do?')).toBeInTheDocument());

    vi.clearAllMocks();

    // Clica sem digitar nada
    const addBtn = screen.getByRole('button');
    fireEvent.click(addBtn);

    // Espera um tick — insert não deve ter sido chamado
    await new Promise(r => setTimeout(r, 50));
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it('adiciona nova tarefa ao pressionar Enter', async () => {
    render(<TodoList />);
    await waitFor(() => expect(screen.getByText('what to do?')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('add a todo item');
    fireEvent.change(input, { target: { value: 'Nova Tarefa Enter' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Nova Tarefa Enter')).toBeInTheDocument();
    });
  });

  it('adiciona nova tarefa ao clicar no botão', async () => {
    render(<TodoList />);
    await waitFor(() => expect(screen.getByText('what to do?')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('add a todo item');
    fireEvent.change(input, { target: { value: 'Nova Tarefa Clique' } });
    const addBtn = screen.getByRole('button');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Nova Tarefa Clique')).toBeInTheDocument();
    });
  });

  it('exibe erro ao falhar ao adicionar tarefa', async () => {
    const { toast } = await import('sonner');
    (supabaseMock.from as any).mockImplementation(() => ({
      ...buildChain(),
      insert: vi.fn().mockResolvedValue({ error: new Error('fail') }),
    }));

    render(<TodoList />);
    await waitFor(() => expect(screen.getByText('what to do?')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('add a todo item');
    fireEvent.change(input, { target: { value: 'Tarefa que vai falhar' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao adicionar tarefa');
    });
  });

  it('alterna o status da tarefa (toggle)', async () => {
    mockTodos = [{ id: '1', title: 'Tarefa para Alternar', completed: false, created_at: 'now' }];
    const chain = buildChain();
    (supabaseMock.from as any).mockImplementation(() => chain);

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Tarefa para Alternar')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(supabaseMock.from).toHaveBeenCalledWith('todo_items');
      expect(chain.update).toHaveBeenCalledWith({ completed: true });
    });
  });

  it('exibe erro ao falhar ao alternar tarefa', async () => {
    const { toast } = await import('sonner');
    mockTodos = [{ id: '1', title: 'Tarefa Toggle Falha', completed: false, created_at: 'now' }];
    let callCount = 0;
    (supabaseMock.from as any).mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        // Segunda chamada (do toggle/update)
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
          order: vi.fn().mockResolvedValue({ data: [...mockTodos], error: null }),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
        return chain;
      }
      return buildChain();
    });

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Tarefa Toggle Falha')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar tarefa');
    });
  });

  it('deleta uma tarefa', async () => {
    mockTodos = [{ id: '1', title: 'Tarefa para Deletar', completed: false, created_at: 'now' }];
    const chain = buildChain();
    (supabaseMock.from as any).mockImplementation(() => chain);

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Tarefa para Deletar')).toBeInTheDocument();
    });

    // O botão de deletar (fica no hover, mas ainda renderizado)
    const deleteBtn = screen.getAllByRole('button')[1];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  it('exibe erro ao falhar ao deletar tarefa', async () => {
    const { toast } = await import('sonner');
    mockTodos = [{ id: '1', title: 'Tarefa Delete Falha', completed: false, created_at: 'now' }];
    let callCount = 0;
    (supabaseMock.from as any).mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return {
          ...buildChain(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: new Error('fail') }),
        };
      }
      return buildChain();
    });

    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Tarefa Delete Falha')).toBeInTheDocument();
    });

    const deleteBtn = screen.getAllByRole('button')[1];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao deletar tarefa');
    });
  });

  it('não carrega tarefas quando não há usuário', async () => {
    (supabaseMock.auth.getUser as any).mockResolvedValue({ data: { user: null } });

    render(<TodoList />);
    // Não deve ter chamado from pois não há user
    await new Promise(r => setTimeout(r, 100));
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
