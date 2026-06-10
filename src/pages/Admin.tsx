import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/types";

const Admin = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      } else {
        setProfile(profileData as Profile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
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