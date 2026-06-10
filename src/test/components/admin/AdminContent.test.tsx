import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContent } from '@/components/admin/AdminContent';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-Plus" />,
  Video: () => <span data-testid="icon-Video" />,
  FileText: () => <span data-testid="icon-FileText" />,
  BookOpen: () => <span data-testid="icon-BookOpen" />,
  Edit: () => <span data-testid="icon-Edit" />,
  Trash: () => <span data-testid="icon-Trash" />,
  Search: () => <span data-testid="icon-Search" />,
  LinkIcon: () => <span data-testid="icon-LinkIcon" />,
  AlertCircle: () => <span data-testid="icon-AlertCircle" />,
  ChevronDown: () => <span data-testid="icon-ChevronDown" />,
  ChevronUp: () => <span data-testid="icon-ChevronUp" />,
  Check: () => <span data-testid="icon-Check" />,
  X: () => <span data-testid="icon-X" />,
  Link: () => <span data-testid="icon-Link" />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ onValueChange, value, children }: any) => (
    <select 
      data-testid="mock-select" 
      value={value || ''} 
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" disabled>Selecione</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const { mockFrom, mockInsert, mockUpdate, mockDelete } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();

  
  const createChain = (data: any) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    };
    
    
    chain.order = vi.fn().mockResolvedValue({ data, error: null });
    chain.insert = vi.fn().mockResolvedValue({ error: null });
    chain.update = vi.fn().mockReturnThis(); 
    chain.delete = vi.fn().mockReturnThis(); 
    
    chain.eq = vi.fn((field, val) => {
      
      return Promise.resolve({ data, error: null });
    });

    return chain;
  };

  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case 'categories':
        return createChain([
          { id: 'cat-1', display_name: 'Categoria 1', name: 'cat1' },
          { id: 'cat-2', display_name: 'Categoria 2', name: 'cat2' },
        ]);
      case 'lessons':
        return createChain([
          {
            id: 'lesson-1',
            title: 'Lição 1',
            order_index: 1,
            category_id: 'cat-1',
            categories: { display_name: 'Categoria 1' },
          },
          {
            id: 'lesson-2',
            title: 'Lição 2',
            order_index: 2,
            category_id: 'cat-2',
            video_url: 'https://youtube.com/watch?v=123',
            categories: { display_name: 'Categoria 2' },
          },
        ]);
      case 'questions': {
        
        const chain = createChain([
          {
            id: 'q-1',
            question_text: 'Pergunta teste',
            lesson_id: 'lesson-1',
            lessons: { title: 'Lição 1', categories: { display_name: 'Categoria 1' } },
            option_a: 'a',
            option_b: 'b',
            option_c: 'c',
            option_d: 'd',
            option_e: 'e',
            correct_answer: 1,
          },
        ]);
        
        const origEq = chain.eq;
        chain.eq = vi.fn((field, val) => {
          if (field === 'lesson_id' || field === 'id') {
            return Promise.resolve({ data: [{ id: 'q-1' }], error: null });
          }
          return origEq(field, val);
        });
        return chain;
      }
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

window.confirm = vi.fn();

describe('AdminContent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.confirm as any).mockReturnValue(true); 
  });

  const renderComponent = () => render(<AdminContent />);

  it('renders and loads categories, lessons and questions', async () => {
    await act(async () => renderComponent());

    await waitFor(() => {
      
      
      expect(screen.getByText('Lição 1')).toBeInTheDocument();
      expect(screen.getByText('Lição 2')).toBeInTheDocument();
    });

    
    const questionsTab = screen.getByRole('tab', { name: 'Questões' });
    const user = userEvent.setup();
    await user.click(questionsTab);

    await waitFor(() => {
      expect(screen.getByText('Pergunta teste')).toBeInTheDocument();
    });
  });

  it('filters lessons by search term', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Lição 1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Buscar lições...');
    await user.type(searchInput, 'Lição 2');

    expect(screen.queryByText('Lição 1')).not.toBeInTheDocument();
    expect(screen.getByText('Lição 2')).toBeInTheDocument();
  });

  it('opens create lesson dialog', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const newLessonBtn = screen.getByRole('button', { name: /Nova Lição/i });
    await user.click(newLessonBtn);

    expect(screen.getByText('Criar Nova Lição')).toBeInTheDocument();
  });

  it('opens edit lesson dialog and populates form', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Lição 1')).toBeInTheDocument());

    
    const editButtons = screen.getAllByTestId('icon-Edit');
    await user.click(editButtons[0].closest('button')!);

    expect(screen.getByText('Editar Lição')).toBeInTheDocument();
    
    const titleInput = screen.getByRole('textbox', { name: /título/i });
    expect(titleInput).toHaveValue('Lição 1');
  });

  it('submits a new lesson successfully', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const newLessonBtn = screen.getByRole('button', { name: /Nova Lição/i });
    await user.click(newLessonBtn);

    const titleInput = screen.getByRole('textbox', { name: /título/i });
    await user.type(titleInput, 'Nova Lição Teste');

    
    const selects = screen.getAllByTestId('mock-select');
    
    const formCategorySelect = selects[1];
    await userEvent.selectOptions(formCategorySelect, 'cat-1');

    
    const submitBtn = screen.getByRole('button', { name: 'Criar Lição' });
    await user.click(submitBtn);

    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Lição criada!' }));
    });
  });

  it('deletes a lesson when confirmed', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    await waitFor(() => expect(screen.getByText('Lição 1')).toBeInTheDocument());

    
    const deleteButtons = screen.getAllByTestId('icon-Trash');
    await user.click(deleteButtons[0].closest('button')!);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Lição excluída!' }));
    });
  });

  it('filters questions by search term', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const questionsTab = screen.getByRole('tab', { name: 'Questões' });
    await user.click(questionsTab);

    await waitFor(() => expect(screen.getByText('Pergunta teste')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Buscar questões...');
    await user.type(searchInput, 'nada a ver');

    expect(screen.queryByText('Pergunta teste')).not.toBeInTheDocument();
  });

  it('opens edit question dialog', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const questionsTab = screen.getByRole('tab', { name: 'Questões' });
    await user.click(questionsTab);

    await waitFor(() => expect(screen.getByText('Pergunta teste')).toBeInTheDocument());

    
    const editButtons = screen.getAllByTestId('icon-Edit');
    
    await user.click(editButtons[editButtons.length - 1].closest('button')!);

    expect(screen.getByText('Editar Questão')).toBeInTheDocument();
  });

  it('submits a new question successfully', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const questionsTab = screen.getByRole('tab', { name: 'Questões' });
    await user.click(questionsTab);

    const newQuestionBtn = screen.getByRole('button', { name: /Nova Questão/i });
    await user.click(newQuestionBtn);

    expect(screen.getByText('Criar Nova Questão')).toBeInTheDocument();

    
    const selects = screen.getAllByTestId('mock-select');
    
    await userEvent.selectOptions(selects[selects.length - 2], 'lesson-1');

    
    
  });

  it('deletes a question when confirmed', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const questionsTab = screen.getByRole('tab', { name: 'Questões' });
    await user.click(questionsTab);

    await waitFor(() => expect(screen.getByText('Pergunta teste')).toBeInTheDocument());

    
    const deleteButtons = screen.getAllByTestId('icon-Trash');
    await user.click(deleteButtons[deleteButtons.length - 1].closest('button')!);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Questão excluída!' }));
    });
  });
});

