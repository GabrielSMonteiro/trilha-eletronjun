import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
