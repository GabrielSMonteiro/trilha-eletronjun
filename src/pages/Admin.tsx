import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  position?: string;
  is_admin?: boolean;
}

const Admin = () => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      // Verifica permissão
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error("Error checking admin role:", roleError);
        toast({
          title: "Erro",
          description: "Erro ao verificar permissões. Tente novamente.",
          variant: "destructive",
        });
        navigate("/app");
        return;
      }

      const isUserAdmin = !!userRole;
      
      if (!isUserAdmin) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive",
        });
        navigate("/app");
        return;
      }

      setIsAuthorized(true);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      }

      setProfile(profile);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Erro",
        description: "Erro ao verificar permissões. Tente novamente.",
        variant: "destructive",
      });
      navigate("/app");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-primary rounded-xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">⚡</span>
          </div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      user={{
        name: profile?.display_name || user?.email || "Admin",
        email: user?.email || "",
        avatar: profile?.avatar_url || "",
        position: profile?.position || "Administrador",
      }}
    />
  );
};

export default Admin;