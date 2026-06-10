import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminRoute } from "@/components/navigation/AdminRoute";
import { useAuth } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
  };
});

describe("AdminRoute", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve mostrar spinner de carregamento quando authLoading for true", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <AdminRoute>
        <div>Admin Panel</div>
      </AdminRoute>
    );

    expect(screen.getByText("Verificando permissões...")).toBeInTheDocument();
  });

  it("deve redirecionar para /app se não houver usuário logado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <AdminRoute>
        <div>Admin Panel</div>
      </AdminRoute>
    );

    const navigateMock = screen.getByTestId("navigate-mock");
    expect(navigateMock).toBeInTheDocument();
    expect(navigateMock).toHaveTextContent("/app");
  });

  it("deve renderizar children se o usuário logado for admin", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "123", email: "admin@test.com" } as any,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null });
    const eqRoleMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqUserMock = vi.fn().mockReturnValue({ eq: eqRoleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });
    
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

    renderWithRouter(
      <AdminRoute>
        <div>Admin Panel</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });
  });

  it("deve redirecionar para /app se o usuário logado não for admin", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "123", email: "user@test.com" } as any,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqRoleMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqUserMock = vi.fn().mockReturnValue({ eq: eqRoleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });
    
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

    renderWithRouter(
      <AdminRoute>
        <div>Admin Panel</div>
      </AdminRoute>
    );

    await waitFor(() => {
      const navigateMock = screen.getByTestId("navigate-mock");
      expect(navigateMock).toBeInTheDocument();
      expect(navigateMock).toHaveTextContent("/app");
    });
  });
});
