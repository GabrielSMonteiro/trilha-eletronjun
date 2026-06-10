import { useState, useEffect } from "react";
import { LearningPath } from "@/components/LearningPath";
import { CategorySelector } from "@/components/CategorySelector";
import { LessonModal } from "@/components/LessonModal";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { BadgesDisplay } from "@/components/gamification/BadgesDisplay";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { useGamification, setGamificationNotificationCallback } from "@/hooks/useGamification";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Lesson } from "@/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useCategories } from "@/hooks/useCategories";
import { useLessonsProgress } from "@/hooks/useLessonsProgress";

const Index = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const { profile, isLoading: isProfileLoading } = useProfile(user?.id);
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const { lessons, progress, isLoading: isLessonsLoading, refetch: refetchLessons } = useLessonsProgress(
    user?.id,
    selectedCategory
  );

  const { toast } = useToast();
  const { addNotification } = useNotifications();

  useEffect(() => {
    setGamificationNotificationCallback((notification) => {
      addNotification(notification);
    });
    return () => {
      setGamificationNotificationCallback(null);
    };
  }, [addNotification]);

  const {
    gamificationData,
    userBadges,
    awardXP,
    updateStreak,
  } = useGamification(user?.id);

  
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status !== "locked") {
      setSelectedLesson(lesson);
    }
  };

  const handleLessonComplete = async (lessonId: string, passed: boolean) => {
    if (!passed) {
      setSelectedLesson(null);
      return;
    }

    toast({
      title: "Parabéns! 🎉",
      description: "Lição concluída com sucesso!",
    });

    refetchLessons();
    setSelectedLesson(null);
  };

  const completedLessons = progress.filter((p) => p.completed_at).length;
  const currentLevel = Math.floor(completedLessons / 3) + 1;

  const isLoading = isProfileLoading || isCategoriesLoading || isLessonsLoading;

  if (isLoading && !categories.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-primary rounded-xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/Logo-EletronJun.png"
              alt="EletronJun Logo"
              className="w-20 h-20 mb-8 mx-auto object-contain"
            />
          </div>
          <p className="text-muted-foreground">Carregando trilhas...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      gamificationData={gamificationData}
      userBadges={userBadges}
      selectedLessonId={selectedLesson?.id}
      profile={profile}
      currentLevel={currentLevel}
      completedLessons={completedLessons}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <CategorySelector
            categories={categories.map(c => ({
              id: c.id,
              name: c.name,
              display_name: c.display_name,
              description: c.description
            }))}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {gamificationData && (
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            <XPProgressBar
              currentXP={gamificationData.total_xp}
              currentLevel={gamificationData.current_level}
            />

            <StreakDisplay
              currentStreak={gamificationData.current_streak}
              longestStreak={gamificationData.longest_streak}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <BadgesDisplay badges={userBadges} />
              <Leaderboard userId={user?.id} />
            </div>
          </div>
        )}

        <LearningPath
          lessons={lessons}
          currentLevel={currentLevel}
          onLessonClick={handleLessonClick}
        />
      </div>

      <LessonModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onComplete={handleLessonComplete}
        userId={user?.id}
        awardXP={awardXP}
        updateStreak={updateStreak}
      />
    </AppLayout>
  );
};

export default Index;
