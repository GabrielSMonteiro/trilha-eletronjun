import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProtectedRoute } from "@/components/navigation/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock">{to}</div>,
  };
});

describe("ProtectedRoute", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it("deve mostrar spinner de carregamento quando isLoading for true", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Verificando autenticação...")).toBeInTheDocument();
  });

  it("deve redirecionar para /auth se não houver usuário", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>
    );

    const navigateMock = screen.getByTestId("navigate-mock");
    expect(navigateMock).toBeInTheDocument();
    expect(navigateMock).toHaveTextContent("/auth");
  });

  it("deve renderizar o conteúdo (children) se houver usuário autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "123", email: "test@test.com" } as any,
      session: { access_token: "token" } as any,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Conteúdo Protegido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Conteúdo Protegido")).toBeInTheDocument();
  });
});
