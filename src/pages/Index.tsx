import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { CategorySelector } from "@/components/CategorySelector";
import { UserProfile } from "@/components/UserProfile";
import { RankingModal } from "@/components/RankingModal";
import { LessonModal } from "@/components/LessonModal";
import { Trophy, User, ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

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
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="md:flex items-center gap-2 hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Início
              </Button>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-primary rounded-xl p-2">
                  <span className="text-primary-foreground font-bold text-xl">
                    <img
                      src="public/Logo-EletronJun.png"
                      alt="EletronJun Logo"
                      className="w-20 h-20 mb-8 mx-auto object-contain"
                    />
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    CapacitaJUN
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Sistema de Capacitações
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRanking(true)}
                className="border-border hover:border-primary/20"
              >
                <Trophy className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="border-border hover:border-primary/20"
              >
                <User className="h-4 w-4" />
              </Button>

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

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Category Selector */}
        <div className="flex justify-center">
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Learning Path */}
        <LearningPath
          lessons={lessons}
          currentLevel={currentLevel}
          onLessonClick={handleLessonClick}
        />

        {/* Floating Profile Card - Mobile */}
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <Button
            onClick={() => setShowProfile(true)}
            className="bg-gradient-primary shadow-strong rounded-full w-14 h-14"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <LessonModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onComplete={handleLessonComplete}
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
                // TODO: Implement profile editing
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
    </div>
  );
};

export default Index;
