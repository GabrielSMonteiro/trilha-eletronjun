import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LearningPath } from '@/components/LearningPath';

// Mock dos ícones para evitar erros de SVG
vi.mock('lucide-react', () => ({
  Trophy: () => <span data-testid="trophy-icon" />,
  Target: () => <span data-testid="target-icon" />,
  Lock: () => <span data-testid="lock-icon" />,
  CheckCircle: () => <span data-testid="check-icon" />,
  Play: () => <span data-testid="play-icon" />,
}));

const makeLessons = (statuses: Array<'locked' | 'available' | 'completed'>) =>
  statuses.map((status, i) => ({
    id: `lesson-${i}`,
    title: `Lição ${i + 1}`,
    status,
  }));

describe('LearningPath', () => {
  it('renderiza o nível atual e contagem de lições', () => {
    const lessons = makeLessons(['completed', 'available', 'locked']);
    const onLessonClick = vi.fn();

    render(<LearningPath lessons={lessons} currentLevel={3} onLessonClick={onLessonClick} />);

    expect(screen.getByText('Nível 3')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('renderiza mensagem de vazio quando não há lições', () => {
    render(<LearningPath lessons={[]} currentLevel={1} onLessonClick={vi.fn()} />);
    expect(screen.getByText('Nenhuma capacitação disponível')).toBeInTheDocument();
  });

  it('exibe parabéns quando todas as lições estão completas', () => {
    const lessons = makeLessons(['completed', 'completed', 'completed']);
    render(<LearningPath lessons={lessons} currentLevel={1} onLessonClick={vi.fn()} />);
    expect(screen.getByText('Parabéns!')).toBeInTheDocument();
    expect(screen.getByText('Você completou toda a trilha!')).toBeInTheDocument();
  });

  it('chama onLessonClick ao clicar em um nó de lição', () => {
    const onLessonClick = vi.fn();
    const lessons = makeLessons(['available']);
    render(<LearningPath lessons={lessons} currentLevel={1} onLessonClick={onLessonClick} />);

    const buttons = screen.getAllByRole('button');
    const enabledBtn = buttons.find(b => !b.hasAttribute('disabled'))!;
    fireEvent.click(enabledBtn);

    expect(onLessonClick).toHaveBeenCalledWith(lessons[0]);
  });

  it('renderiza múltiplas lições corretamente', () => {
    const lessons = makeLessons(['completed', 'available', 'locked', 'locked']);
    render(<LearningPath lessons={lessons} currentLevel={2} onLessonClick={vi.fn()} />);

    expect(screen.getByText('Lição 1')).toBeInTheDocument();
    expect(screen.getByText('Lição 2')).toBeInTheDocument();
    expect(screen.getByText('Lição 3')).toBeInTheDocument();
    expect(screen.getByText('Lição 4')).toBeInTheDocument();
    // 1 completada de 4
    expect(screen.getByText('1/4')).toBeInTheDocument();
  });
});
