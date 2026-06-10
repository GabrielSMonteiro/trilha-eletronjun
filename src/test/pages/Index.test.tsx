import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from '@/pages/Index';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockAddNotification = vi.fn();
vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: mockAddNotification }),
}));

const mockProfileData = { id: 'user-1', display_name: 'Test User' };
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfileData,
    isLoading: false,
  }),
}));

const mockCategoriesData = [{ id: 'cat-1', name: 'Trilha 1', display_name: 'Trilha 1' }];
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: mockCategoriesData,
    isLoading: false,
  }),
}));

const mockLessonsData = [{ id: 'lesson-1', title: 'L1', status: 'available' }];
const mockRefetchLessons = vi.fn();
vi.mock('@/hooks/useLessonsProgress', () => ({
  useLessonsProgress: () => ({
    lessons: mockLessonsData,
    progress: [{ lesson_id: 'lesson-1', completed_at: '2023-01-01' }],
    isLoading: false,
    refetch: mockRefetchLessons,
  }),
}));

const mockAwardXP = vi.fn();
const mockUpdateStreak = vi.fn();
const mockCheckAndAwardBadges = vi.fn();
let mockGamificationData: any = null;
let mockUserBadges: any[] = [];

vi.mock('@/hooks/useGamification', () => ({
  useGamification: () => ({
    gamificationData: mockGamificationData,
    userBadges: mockUserBadges,
    loading: false,
    awardXP: mockAwardXP,
    updateStreak: mockUpdateStreak,
    checkAndAwardBadges: mockCheckAndAwardBadges,
  }),
  setGamificationNotificationCallback: vi.fn(),
}));

let mockUser: any = null;
let mockAuthLoading = false;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    session: mockUser ? { user: mockUser } : null,
    isLoading: mockAuthLoading,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children, gamificationData }: any) => (
    <div data-testid="app-layout">
      {gamificationData && <div data-testid="layout-gamification-injected" />}
      {children}
    </div>
  ),
}));

vi.mock('@/components/LearningPath', () => ({
  LearningPath: ({ onLessonClick }: any) => (
    <div data-testid="learning-path">
      <button onClick={() => onLessonClick({ id: 'lesson-1', status: 'available' })}>
        Click Lesson
      </button>
    </div>
  ),
}));

vi.mock('@/components/CategorySelector', () => ({
  CategorySelector: () => <div data-testid="category-selector" />,
}));

vi.mock('@/components/LessonModal', () => ({
  LessonModal: ({ isOpen, onComplete }: any) =>
    isOpen ? (
      <div data-testid="lesson-modal">
        <button onClick={() => onComplete('lesson-1', true)}>Complete Passed</button>
        <button onClick={() => onComplete('lesson-1', false)}>Complete Failed</button>
      </div>
    ) : null,
}));

vi.mock('@/components/gamification/XPProgressBar', () => ({
  XPProgressBar: () => <div data-testid="xp-progress-bar" />,
}));
vi.mock('@/components/gamification/BadgesDisplay', () => ({
  BadgesDisplay: () => <div data-testid="badges-display" />,
}));
vi.mock('@/components/gamification/StreakDisplay', () => ({
  StreakDisplay: () => <div data-testid="streak-display" />,
}));
vi.mock('@/components/gamification/Leaderboard', () => ({
  Leaderboard: () => <div data-testid="leaderboard" />,
}));

describe('Index Page (Dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'user-1', email: 'test@example.com' };
    mockAuthLoading = false;
    mockGamificationData = { total_xp: 100, current_level: 2, current_streak: 5, longest_streak: 10 };
    mockUserBadges = [{ id: 'b1' }];
  });

  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Index />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders dashboard correctly with user data and layout', async () => {
    await act(async () => renderComponent());

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      expect(screen.getByTestId('category-selector')).toBeInTheDocument();
      expect(screen.getByTestId('learning-path')).toBeInTheDocument();
    });
  });

  it('renders gamification components when gamificationData is present', async () => {
    await act(async () => renderComponent());
    await waitFor(() => {
      expect(screen.getByTestId('xp-progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('streak-display')).toBeInTheDocument();
      expect(screen.getByTestId('badges-display')).toBeInTheDocument();
      expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
    });
  });

  it('does not render gamification components if gamificationData is null', async () => {
    mockGamificationData = null;
    await act(async () => renderComponent());
    await waitFor(() => {
      expect(screen.queryByTestId('xp-progress-bar')).not.toBeInTheDocument();
    });
  });

  it('opens LessonModal when a lesson is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const clickLessonBtn = screen.getByText('Click Lesson');
    await user.click(clickLessonBtn);

    expect(screen.getByTestId('lesson-modal')).toBeInTheDocument();
  });

  it('handles lesson completion (passed)', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const clickLessonBtn = screen.getByText('Click Lesson');
    await user.click(clickLessonBtn);

    const completePassedBtn = screen.getByText('Complete Passed');
    await user.click(completePassedBtn);

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Parabéns! 🎉' }));
    expect(mockRefetchLessons).toHaveBeenCalled();
    expect(screen.queryByTestId('lesson-modal')).not.toBeInTheDocument();
  });

  it('handles lesson completion (failed)', async () => {
    const user = userEvent.setup();
    await act(async () => renderComponent());

    const clickLessonBtn = screen.getByText('Click Lesson');
    await user.click(clickLessonBtn);

    const completeFailedBtn = screen.getByText('Complete Failed');
    await user.click(completeFailedBtn);

    expect(screen.queryByTestId('lesson-modal')).not.toBeInTheDocument();
    expect(mockToast).not.toHaveBeenCalled();
  });
});
