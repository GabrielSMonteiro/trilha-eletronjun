import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategories } from "@/hooks/useCategories";
import { categoriesService } from "@/services/categoriesService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/services/categoriesService", () => ({
  categoriesService: {
    getAllCategories: vi.fn(),
  },
}));

describe("useCategories hook", () => {
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

  it("deve carregar as categorias corretamente", async () => {
    const mockCategories = [
      { id: "1", name: "Categoria 1", display_name: "Categoria 1", description: "Desc 1" },
      { id: "2", name: "Categoria 2", display_name: "Categoria 2", description: "Desc 2" }
    ];
    
    vi.mocked(categoriesService.getAllCategories).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockCategories);
    expect(categoriesService.getAllCategories).toHaveBeenCalledTimes(1);
  });

  it("deve retornar um array vazio se der erro ou não houver dados", async () => {
    vi.mocked(categoriesService.getAllCategories).mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBeDefined();
  });
});
