/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QuickAccessSidebar } from "@/components/QuickAccessSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Trophy, User, ArrowLeft, LogOut, Users, BarChart3, Sparkles, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AllNotesPanel } from "@/components/AllNotesPanel";
import { UserProfileModal } from "@/components/UserProfileModal";
import { UserProfile } from "@/components/UserProfile";
import { RankingModal } from "@/components/RankingModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: React.ReactNode;
  gamificationData?: any;
  userBadges?: any[];
  selectedLessonId?: string;
  profile?: any;
  currentLevel?: number;
  completedLessons?: number;
}

export const AppLayout = ({
  children,
  gamificationData,
  userBadges = [],
  selectedLessonId,
  profile,
  currentLevel = 1,
  completedLessons = 0,
}: AppLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isKanbanOpen, setIsKanbanOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-soft shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hidden md:flex items-center gap-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Início
              </Button>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="bg-gradient-primary rounded-lg sm:rounded-xl p-1.5 sm:p-2 shrink-0">
                  <img
                    src="/Logo-EletronJun.png"
                    alt="EletronJun Logo"
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-xl font-bold text-foreground truncate">
                    CapacitaJUN
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                    Sistema de Capacitações
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ai")}
                className="border-border hover:border-primary/20 h-8 sm:h-9 px-2 sm:px-3 gap-1"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs">IA</span>
              </Button>

              <NotificationCenter />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRanking(true)}
                className="border-border hover:border-primary/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/community")}
                className="border-border hover:border-primary/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/analytics")}
                className="border-border hover:border-primary/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="border-border hover:border-primary/20 h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-border hover:border-destructive/20 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {}
        <div className="hidden md:block">
          <QuickAccessSidebar
            gamificationData={gamificationData}
            badgesCount={userBadges.length}
            userId={user?.id}
            selectedLessonId={selectedLessonId}
            onOpenKanban={() => setIsKanbanOpen(!isKanbanOpen)}
            onOpenNotes={() => setIsNotesOpen(!isNotesOpen)}
            isKanbanOpen={isKanbanOpen}
            isNotesOpen={isNotesOpen}
          />
        </div>

        {}
        <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-4 left-4 h-12 w-12 rounded-full bg-gradient-primary shadow-strong z-50 md:hidden"
              size="icon"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Seu Progresso
              </h3>

              {gamificationData && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800">
                    <div className="text-white/70 text-[10px] font-medium">Nível</div>
                    <div className="text-white text-lg font-bold">{gamificationData.current_level}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                    <div className="text-white/70 text-[10px] font-medium">XP</div>
                    <div className="text-white text-lg font-bold">{gamificationData.total_xp}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                    <div className="text-white/70 text-[10px] font-medium">Sequência</div>
                    <div className="text-white text-lg font-bold">{gamificationData.current_streak} dias</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
                    <div className="text-white/70 text-[10px] font-medium">Conquistas</div>
                    <div className="text-white text-lg font-bold">{userBadges.length}</div>
                  </div>
                </div>
              )}

              <div className="border-t border-border my-3" />

              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ferramentas
              </h3>

              <Button
                onClick={() => {
                  navigate('/cafe');
                  setShowMobileSidebar(false);
                }}
                className="w-full justify-start gap-3 bg-gradient-to-br from-amber-600 to-amber-700 text-white"
              >
                ☕ Cafeteria Virtual
              </Button>

              <Button
                onClick={() => {
                  setIsKanbanOpen(!isKanbanOpen);
                  setShowMobileSidebar(false);
                }}
                variant={isKanbanOpen ? "default" : "outline"}
                className="w-full justify-start gap-3"
              >
                📋 Meu Progresso
              </Button>

              <Button
                onClick={() => {
                  setIsNotesOpen(!isNotesOpen);
                  setShowMobileSidebar(false);
                }}
                variant={isNotesOpen ? "default" : "outline"}
                className="w-full justify-start gap-3"
              >
                ✏️ Anotações
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {}
        <main className="flex-1 overflow-y-auto w-full md:ml-64">
          {children}
        </main>
      </div>

      {}
      <RankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
      />

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md">
            <UserProfile
              user={{
                name: profile?.display_name || user?.email || "Usuário",
                email: user?.email || "",
                avatar: profile?.avatar_url || "",
                position: profile?.position || "Membro",
                completedLessons,
                level: currentLevel,
                currentStreak: gamificationData?.current_streak || 0,
              }}
              onEditProfile={() => {
                setShowProfile(false);
                setShowSettings(true);
              }}
            />
            <Button
              variant="outline"
              className="w-full mt-4 border-border hover:border-primary/20"
              onClick={() => setShowProfile(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      <UserProfileModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={user?.id || ''}
        userEmail={user?.email || ''}
      />

      {user && isKanbanOpen && (
        <div className="fixed top-[72px] right-0 w-96 h-[calc(100vh-72px)] bg-card border-l border-border shadow-lg z-40 overflow-y-auto">
          <KanbanBoard userId={user.id} embedded onClose={() => setIsKanbanOpen(false)} />
        </div>
      )}

      {user && isNotesOpen && (
        <div className="fixed top-[72px] right-0 w-96 h-[calc(100vh-72px)] bg-card border-l border-border shadow-lg z-40 overflow-hidden">
          <AllNotesPanel userId={user.id} onClose={() => setIsNotesOpen(false)} />
        </div>
      )}
    </div>
  );
};
