import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { ArrowLeft, LogOut, Sparkles } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Analytics = () => {
  const { user, session, isLoading: authLoading } = useAuth();

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-primary rounded-xl p-2">
                  <img
                    src="/Logo-EletronJun.png"
                    alt="EletronJun Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Analytics</h1>
                  <p className="text-xs text-muted-foreground">Dashboard de Desempenho</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ai")}
                className="border-border hover:border-primary/20 h-9 px-3 gap-1"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">IA</span>
              </Button>

              <NotificationCenter />

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-border hover:border-destructive/20 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnalyticsDashboard userId={user.id} />
      </div>
    </div>
  );
};

export default Analytics;
