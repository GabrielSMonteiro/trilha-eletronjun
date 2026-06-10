import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLessonsProgress } from "@/hooks/useLessonsProgress";
import { lessonsService } from "@/services/lessonsService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/services/lessonsService", () => ({
  lessonsService: {
    getLessonsByCategory: vi.fn(),
    getUserProgress: vi.fn(),
  },
}));

describe("useLessonsProgress hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("deve retornar lições com os devidos status baseados no progresso", async () => {
    const mockLessons = [
      { id: "L1", order_index: 1, title: "Licao 1", status: "locked" },
      { id: "L2", order_index: 2, title: "Licao 2", status: "locked" },
      { id: "L3", order_index: 3, title: "Licao 3", status: "locked" }
    ] as any;

    const mockProgress = [
      { lesson_id: "L1", completed_at: new Date().toISOString() }
    ];

    vi.mocked(lessonsService.getLessonsByCategory).mockResolvedValue(mockLessons);
    vi.mocked(lessonsService.getUserProgress).mockResolvedValue(mockProgress);

    const { result } = renderHook(() => useLessonsProgress("user123", "Cat1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const lessons = result.current.lessons;
    
    
    expect(lessons[0].status).toBe("completed");
    
    
    expect(lessons[1].status).toBe("available");
    
    
    expect(lessons[2].status).toBe("locked");
  });

  it("deve deixar a primeira lição disponível mesmo sem progresso nenhum", async () => {
    const mockLessons = [
      { id: "L1", order_index: 1, title: "Licao 1", status: "locked" },
      { id: "L2", order_index: 2, title: "Licao 2", status: "locked" }
    ] as any;

    const mockProgress: any[] = [];

    vi.mocked(lessonsService.getLessonsByCategory).mockResolvedValue(mockLessons);
    vi.mocked(lessonsService.getUserProgress).mockResolvedValue(mockProgress);

    const { result } = renderHook(() => useLessonsProgress("user123", "Cat1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const lessons = result.current.lessons;
    
    expect(lessons[0].status).toBe("available");
    expect(lessons[1].status).toBe("locked");
  });
  
  it("não deve chamar os endpoints se parâmetros requeridos não forem providenciados", () => {
    const { result } = renderHook(() => useLessonsProgress(undefined, ""), { wrapper });
    
    expect(lessonsService.getLessonsByCategory).not.toHaveBeenCalled();
    expect(lessonsService.getUserProgress).not.toHaveBeenCalled();
    expect(result.current.lessons).toEqual([]);
    expect(result.current.progress).toEqual([]);
  });
});
