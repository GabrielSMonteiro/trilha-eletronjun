import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type AdminCheckState = "loading" | "authorized" | "unauthorized" | "error";

interface AdminRouteProps {
  children: React.ReactNode;
  
  redirectTo?: string;
}

export const AdminRoute = ({
  children,
  redirectTo = "/app",
}: AdminRouteProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<AdminCheckState>("loading");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState("unauthorized");
      return;
    }

    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          setState("error");
          return;
        }

        setState(data ? "authorized" : "unauthorized");
      } catch (err) {
        console.error("Unexpected error checking admin role:", err);
        setState("error");
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  if (authLoading || state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-primary rounded-xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/Logo-EletronJun.png"
              alt="EletronJun Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-foreground">Erro ao verificar permissões</h1>
          <p className="text-muted-foreground">
            Não foi possível verificar suas permissões de administrador. Isso pode ser um
            problema temporário. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (state === "unauthorized") {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
