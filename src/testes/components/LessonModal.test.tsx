import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonModal } from '@/components/LessonModal';

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));
vi.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="icon-CheckCircle" />,
  X: () => <span data-testid="icon-X" />,
  Pencil: () => <span data-testid="icon-Pencil" />,
  ChevronLeft: () => <span data-testid="icon-ChevronLeft" />,
  ChevronRight: () => <span data-testid="icon-ChevronRight" />,
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/VideoPlayer', () => ({
  VideoPlayer: ({ title }: any) => <div data-testid="mock-video-player">{title}</div>,
}));

vi.mock('@/components/LessonNotesPanel', () => ({
  default: ({ notes, onNotesChange, onSave }: any) => (
    <div data-testid="mock-notes-panel">
      <textarea
        data-testid="notes-input"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
      />
      <button onClick={onSave}>Save Notes</button>
    </div>
  ),
}));

const { mockFrom, mockInvoke } = vi.hoisted(() => {
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockInvoke = vi.fn();

  const createChain = (data: any) => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => Promise.resolve({ data, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: data ? data[0] : null, error: null })),
      upsert: mockUpsert,
    };
    return chain;
  };

  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case 'questions_for_users':
        return createChain([
          {
            id: 'q-1',
            question_text: 'Qual a cor do cavalo branco de Napoleão?',
            option_a: 'Branco',
            option_b: 'Preto',
            option_c: 'Marrom',
            option_d: 'Azul',
          },
        ]);
      case 'lesson_notes':
        return createChain([{ content: 'Minhas anotações' }]);
      default:
        return createChain([]);
    }
  });

  return { mockFrom, mockInvoke, mockUpsert };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockInvoke,
    },
  },
}));

describe('LessonModal Component', () => {
  const defaultProps = {
    lesson: { id: 'lesson-1', title: 'Introdução', description: 'Desc' },
    isOpen: true,
    onClose: vi.fn(),
    onComplete: vi.fn(),
    userId: 'user-1',
    awardXP: vi.fn().mockResolvedValue(undefined),
    updateStreak: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders content phase initially and loads questions', async () => {
    render(<LessonModal {...defaultProps} />);

    expect(screen.getAllByText('Introdução')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Desc')[0]).toBeInTheDocument();
    expect(screen.getByTestId('mock-video-player')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Após assistir o conteúdo, responda as 1 questões/i)).toBeInTheDocument();
    });
  });

  it('starts the quiz and answers a question', async () => {
    const user = userEvent.setup();
    render(<LessonModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Iniciar Quiz/i })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Iniciar Quiz/i }));

    expect(screen.getByText('Qual a cor do cavalo branco de Napoleão?')).toBeInTheDocument();

    const optionA = screen.getByText('Branco').closest('button')!;
    await user.click(optionA);

    const finishBtn = screen.getByRole('button', { name: /Finalizar/i });

    mockInvoke.mockResolvedValueOnce({
      data: { correctCount: 1, totalQuestions: 1, score: 100, passed: true },
      error: null,
    });

    await user.click(finishBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('validate-quiz', expect.any(Object));
      expect(screen.getByText('Você acertou 1 de 1 questões')).toBeInTheDocument();
      expect(defaultProps.awardXP).toHaveBeenCalled();
      expect(defaultProps.onComplete).toHaveBeenCalledWith('lesson-1', true);
    });
  });

  it('fails the quiz and shows try again', async () => {
    const user = userEvent.setup();
    render(<LessonModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByRole('button', { name: /Iniciar Quiz/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Iniciar Quiz/i }));

    const optionB = screen.getByText('Preto').closest('button')!;
    await user.click(optionB);

    const finishBtn = screen.getByRole('button', { name: /Finalizar/i });

    mockInvoke.mockResolvedValueOnce({
      data: { correctCount: 0, totalQuestions: 1, score: 0, passed: false },
      error: null,
    });

    await user.click(finishBtn);

    await waitFor(() => {
      expect(screen.getByText('Quase lá!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tentar Novamente/i })).toBeInTheDocument();
    });
  });

  it('toggles notes panel and loads/saves notes', async () => {
    const user = userEvent.setup();
    render(<LessonModal {...defaultProps} />);

    const toggleNotesBtn = screen.getByRole('button', { name: /Anotações/i });
    await user.click(toggleNotesBtn);

    await waitFor(() => expect(screen.getByTestId('mock-notes-panel')).toBeInTheDocument());

    const notesInput = screen.getByTestId('notes-input');
    expect(notesInput).toHaveValue('Minhas anotações');

    await user.clear(notesInput);
    await user.type(notesInput, 'Nova anotação');

    const saveBtn = screen.getByRole('button', { name: 'Save Notes' });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Salvo!' }));
    });
  });
});
