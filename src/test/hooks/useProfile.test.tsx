import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useProfile } from "@/hooks/useProfile";
import { profileService } from "@/services/profileService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/services/profileService", () => ({
  profileService: {
    getProfileByUserId: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe("useProfile hook", () => {
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

  it("deve carregar o perfil corretamente quando o userId for providenciado", async () => {
    const mockProfile = { id: "1", user_id: "123", display_name: "Test User" };
    vi.mocked(profileService.getProfileByUserId).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile("123"), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(profileService.getProfileByUserId).toHaveBeenCalledWith("123");
  });

  it("não deve chamar a API se o userId não for providenciado", () => {
    const { result } = renderHook(() => useProfile(undefined), { wrapper });

    expect(result.current.profile).toBeUndefined();
    expect(profileService.getProfileByUserId).not.toHaveBeenCalled();
  });

  it("deve atualizar o perfil corretamente", async () => {
    const mockProfile = { id: "1", user_id: "123", display_name: "Test User" };
    const mockUpdatedProfile = { id: "1", user_id: "123", display_name: "Test User Updated" };
    
    vi.mocked(profileService.getProfileByUserId).mockResolvedValue(mockProfile);
    vi.mocked(profileService.updateProfile).mockResolvedValue(mockUpdatedProfile);

    const { result } = renderHook(() => useProfile("123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.updateProfile({ display_name: "Test User Updated" });

    expect(profileService.updateProfile).toHaveBeenCalledWith("123", { display_name: "Test User Updated" });
    
    
    await waitFor(() => {
      expect(result.current.profile).toEqual(mockUpdatedProfile);
    });
  });
});
