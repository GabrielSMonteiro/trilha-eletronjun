import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from '@/components/KanbanBoard';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const { mockInsert, mockOrder, supabaseChain } = vi.hoisted(() => {
  const mockOrder = vi.fn();
  const mockInsert = vi.fn();
  const supabaseChain = {
    select: vi.fn().mockReturnThis(),
    insert: mockInsert,
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: mockOrder,
  };
  return { mockInsert, mockOrder, supabaseChain };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => supabaseChain),
  },
}));

const makeTasks = () => [
  { id: 'task-1', title: 'Estudar TypeScript', status: 'todo' as const },
  { id: 'task-2', title: 'Revisar PR', status: 'in_progress' as const },
  { id: 'task-3', title: 'Deploy realizado', status: 'done' as const },
];

const renderEmbedded = (userId = 'user-123') =>
  render(<KanbanBoard userId={userId} embedded={true} />);

const renderFloating = (userId = 'user-123') =>
  render(<KanbanBoard userId={userId} embedded={false} />);

const getAddButton = () => {
  const input = screen.getByPlaceholderText('Nova tarefa...');
  const container = input.closest('div');
  return container?.querySelector('button') as HTMLElement;
};

describe('KanbanBoard — embedded mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: makeTasks(), error: null });
    mockInsert.mockResolvedValue({ error: null });
    supabaseChain.eq = vi.fn().mockReturnThis();
    supabaseChain.update = vi.fn().mockReturnThis();
    supabaseChain.delete = vi.fn().mockReturnThis();
  });

  it('renders the board header with title', async () => {
    await act(async () => renderEmbedded());
    expect(screen.getByText('Meu Progresso')).toBeInTheDocument();
  });

  it('renders all three column headers', async () => {
    await act(async () => renderEmbedded());
    await waitFor(() => expect(screen.getByText('Estudar TypeScript')).toBeInTheDocument());

    expect(screen.getAllByText(/A Fazer/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Em Andamento/).length).toBeGreaterThan(0);
    const columnHeaders = document.querySelectorAll('.bg-gradient-to-r');
    const headerTexts = Array.from(columnHeaders).map((h) => h.textContent);
    expect(headerTexts.some((t) => t?.includes('A Fazer'))).toBe(true);
    expect(headerTexts.some((t) => t?.includes('Em Andamento'))).toBe(true);
    expect(headerTexts.some((t) => t?.includes('Concluído'))).toBe(true);
  });

  it('renders the new task input', async () => {
    await act(async () => renderEmbedded());
    expect(screen.getByPlaceholderText('Nova tarefa...')).toBeInTheDocument();
  });

  it('loads and displays tasks from Supabase', async () => {
    await act(async () => renderEmbedded());
    await waitFor(() => {
      expect(screen.getByText('Estudar TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Revisar PR')).toBeInTheDocument();
      expect(screen.getByText('Deploy realizado')).toBeInTheDocument();
    });
  });

  it('does not call insert when the input is empty', async () => {
    await act(async () => renderEmbedded());
    const addBtn = getAddButton();
    if (addBtn) await act(async () => fireEvent.click(addBtn));
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('adds a task on Enter keypress', async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockOrder.mockResolvedValue({ data: makeTasks(), error: null });

    await act(async () => renderEmbedded());

    const input = screen.getByPlaceholderText('Nova tarefa...');
    await userEvent.type(input, 'Tarefa via Enter');
    await act(async () =>
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
    );

    await waitFor(() => expect(mockInsert).toHaveBeenCalled());
  });

  it('adds a task on button click', async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockOrder.mockResolvedValue({ data: makeTasks(), error: null });

    await act(async () => renderEmbedded());

    const input = screen.getByPlaceholderText('Nova tarefa...');
    await userEvent.type(input, 'Nova tarefa via botão');

    const addBtn = getAddButton();
    await act(async () => {
      if (addBtn) fireEvent.click(addBtn);
    });

    await waitFor(() => expect(mockInsert).toHaveBeenCalled());
  });

  it('shows an error toast when adding a task fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    await act(async () => renderEmbedded());

    const input = screen.getByPlaceholderText('Nova tarefa...');
    await userEvent.type(input, 'Tarefa com erro');
    await act(async () =>
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
    );

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' })
      )
    );
  });

  it('calls onClose when close button is clicked in embedded mode with onClose prop', async () => {
    const onClose = vi.fn();
    await act(async () =>
      render(<KanbanBoard userId="user-123" embedded={true} onClose={onClose} />)
    );

    const header = document.querySelector('.bg-gradient-to-br');
    const closeBtn = header?.querySelector('button');
    if (closeBtn) await act(async () => fireEvent.click(closeBtn));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe('KanbanBoard — floating mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('renders a floating button with aria-label "Kanban"', () => {
    renderFloating();
    expect(screen.getByLabelText('Kanban')).toBeInTheDocument();
  });

  it('does not show the task input initially', () => {
    renderFloating();
    expect(screen.queryByPlaceholderText('Nova tarefa...')).not.toBeInTheDocument();
  });

  it('opens the Kanban panel when the floating button is clicked', async () => {
    renderFloating();
    const floatingBtn = screen.getByLabelText('Kanban');
    await act(async () => fireEvent.click(floatingBtn));
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Nova tarefa...')).toBeInTheDocument()
    );
  });

  it('closes the panel when the floating button is clicked again', async () => {
    renderFloating();
    const floatingBtn = screen.getByLabelText('Kanban');

    await act(async () => fireEvent.click(floatingBtn));
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Nova tarefa...')).toBeInTheDocument()
    );

    const header = document.querySelector('.fixed.inset-4 .bg-gradient-to-br');
    const closeBtn = header?.querySelector('button');
    if (closeBtn) {
      await act(async () => fireEvent.click(closeBtn));
    }

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('Nova tarefa...')).not.toBeInTheDocument()
    );
  });
});
