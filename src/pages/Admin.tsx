import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  position?: string;
  is_admin?: boolean;
}

const Admin = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Authentication setup
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load profile and check admin access
  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar perfil. Tente novamente.",
          variant: "destructive",
        });
        navigate("/app");
        return;
      }

      const isUserAdmin = user.email === "admin@eletronjun.com.br" || profile?.is_admin;
      
      if (!isUserAdmin) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive",
        });
        navigate("/app");
        return;
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

  if (isLoading) {
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