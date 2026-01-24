import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { CategorySelector } from "@/components/CategorySelector";
import { UserProfile } from "@/components/UserProfile";
import { UserProfileModal } from "@/components/UserProfileModal";
import { RankingModal } from "@/components/RankingModal";
import { LessonModal } from "@/components/LessonModal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LessonNotes } from "@/components/LessonNotes";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { BadgesDisplay } from "@/components/gamification/BadgesDisplay";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { QuickAccessSidebar, QuickAccessMobileTrigger } from "@/components/QuickAccessSidebar";
import { useGamification, setGamificationNotificationCallback } from "@/hooks/useGamification";
import { useNotifications } from "@/contexts/NotificationContext";
import { Trophy, User, ArrowLeft, LogOut, Users, BarChart3, Sparkles, Menu } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  position?: string;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  external_link?: string;
  order_index: number;
  status: "locked" | "available" | "completed";
  questions?: any[];
}

interface UserProgress {
  lesson_id: string;
  completed_at?: string;
  score?: number;
}

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isKanbanOpen, setIsKanbanOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  
  // Connect gamification notifications to the notification center
  useEffect(() => {
    setGamificationNotificationCallback((notification) => {
      addNotification(notification);
    });
    return () => {
      setGamificationNotificationCallback(null);
    };
  }, [addNotification]);
  // Gamification hook
  const {
    gamificationData,
    userBadges,
    loading: gamificationLoading,
    awardXP,
    updateStreak,
    checkAndAwardBadges,
  } = useGamification(user?.id);

  // Authentication setup
  useEffect(() => {
    // Set up auth state listener
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

  // Load user profile
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Set first category as default when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  // Load lessons and progress when category changes
  useEffect(() => {
    if (selectedCategory && user) {
      loadLessonsAndProgress();
    }
  }, [selectedCategory, user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error loading categories:", error);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadLessonsAndProgress = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load lessons for selected category
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          `
          id,
          title,
          description,
          video_url,
          external_link,
          order_index,
          categories!inner(name)
        `
        )
        .eq("categories.name", selectedCategory)
        .order("order_index");

      if (lessonsError) {
        console.error("Error loading lessons:", lessonsError);
        setLessons([]);
        return;
      }

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("lesson_id, completed_at, score")
        .eq("user_id", user.id);

      if (progressError) {
        console.error("Error loading progress:", progressError);
        setUserProgress([]);
      } else {
        setUserProgress(progressData || []);
      }

      // Process lessons with status based on progress
      const processedLessons = (lessonsData || []).map((lesson, index) => {
        const progress = progressData?.find((p) => p.lesson_id === lesson.id);

        let status: "locked" | "available" | "completed" = "locked";

        if (progress?.completed_at) {
          status = "completed";
        } else if (index === 0) {
          // First lesson is always available
          status = "available";
        } else {
          // Check if previous lesson is completed
          const prevLesson = lessonsData[index - 1];
          const prevProgress = progressData?.find(
            (p) => p.lesson_id === prevLesson.id
          );
          if (prevProgress?.completed_at) {
            status = "available";
          }
        }

        return {
          ...lesson,
          status,
          questions: [], // Will be loaded when lesson is opened
        };
      });

      setLessons(processedLessons);
    } catch (error) {
      console.error("Error loading lessons and progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status !== "locked") {
      setSelectedLesson(lesson);
    }
  };

  const handleLessonComplete = async (lessonId: string, passed: boolean) => {
    if (!user || !passed) {
      setSelectedLesson(null);
      return;
    }

    try {
      // Update or insert progress
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          score: 80, // Assuming 80% as passing score
          attempts: 1,
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

      if (error) {
        console.error("Error updating progress:", error);
        toast({
          title: "Erro",
          description: "Erro ao salvar progresso. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Parabéns! 🎉",
          description: "Lição concluída com sucesso!",
        });

        // Reload lessons and progress
        loadLessonsAndProgress();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }

    setSelectedLesson(null);
  };

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

  const completedLessons = userProgress.filter((p) => p.completed_at).length;
  const currentLevel = Math.floor(completedLessons / 3) + 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-primary rounded-xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">
              <img
                src="public/Logo-EletronJun.png"
                alt="EletronJun Logo"
                className="w-20 h-20 mb-8 mx-auto object-contain"
              />
            </span>
          </div>
          <p className="text-muted-foreground">Carregando trilhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
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
                    src="public/Logo-EletronJun.png"
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
              {/* AI Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ai")}
                className="border-border hover:border-primary/20 h-8 sm:h-9 px-2 sm:px-3 gap-1"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs">IA</span>
              </Button>

              {/* Notification Center */}
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

      {/* Quick Access Sidebar - Desktop */}
      <div className="hidden md:block">
        <QuickAccessSidebar
          gamificationData={gamificationData}
          badgesCount={userBadges.length}
          userId={user?.id}
          selectedLessonId={selectedLesson?.id}
          onOpenKanban={() => setIsKanbanOpen(!isKanbanOpen)}
          onOpenNotes={() => setIsNotesOpen(!isNotesOpen)}
          isKanbanOpen={isKanbanOpen}
          isNotesOpen={isNotesOpen}
        />
      </div>

      {/* Mobile Sidebar Trigger */}
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

            {selectedLesson && (
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
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:ml-64 max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Category Selector */}
        <div className="flex justify-center">
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Gamification Section */}
        {gamificationData && (
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {/* XP Progress Bar */}
            <XPProgressBar
              currentXP={gamificationData.total_xp}
              currentLevel={gamificationData.current_level}
            />

            {/* Streaks */}
            <StreakDisplay
              currentStreak={gamificationData.current_streak}
              longestStreak={gamificationData.longest_streak}
            />

            {/* Badges and Leaderboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <BadgesDisplay badges={userBadges} />
              <Leaderboard userId={user?.id} />
            </div>
          </div>
        )}

        {/* Learning Path */}
        <LearningPath
          lessons={lessons}
          currentLevel={currentLevel}
          onLessonClick={handleLessonClick}
        />

      </div>

      {/* Modals */}
      <LessonModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onComplete={handleLessonComplete}
        userId={user?.id}
        awardXP={awardXP}
        updateStreak={updateStreak}
      />

      <RankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
      />

      {/* Profile Modal/Sidebar */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md">
            <UserProfile
              user={{
                name: profile?.display_name || user?.email || "Usuário",
                email: user?.email || "",
                avatar: profile?.avatar_url || "",
                position: profile?.position || "Membro",
                completedLessons,
                level: currentLevel,
                currentStreak: 0, // Will be calculated based on progress
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

      {/* Settings Modal */}
      <UserProfileModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={user?.id || ''}
        userEmail={user?.email || ''}
      />

      {/* Kanban Board Panel */}
      {user && isKanbanOpen && (
        <div className="fixed top-[72px] right-0 w-96 h-[calc(100vh-72px)] bg-card border-l border-border shadow-lg z-40 overflow-y-auto">
          <KanbanBoard userId={user.id} embedded onClose={() => setIsKanbanOpen(false)} />
        </div>
      )}

    </div>
  );
};

export default Index;
