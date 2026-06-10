import { useQuery } from "@tanstack/react-query";
import { lessonsService } from "@/services/lessonsService";

export const useLessonsProgress = (userId: string | undefined, selectedCategory: string) => {
  const lessonsQuery = useQuery({
    queryKey: ["lessons", selectedCategory],
    queryFn: () => lessonsService.getLessonsByCategory(selectedCategory),
    enabled: !!selectedCategory,
  });

  const progressQuery = useQuery({
    queryKey: ["progress", userId],
    queryFn: () => lessonsService.getUserProgress(userId as string),
    enabled: !!userId,
  });

  const isLoading = lessonsQuery.isLoading || progressQuery.isLoading;
  const lessonsData = lessonsQuery.data || [];
  const progressData = progressQuery.data || [];

  
  const processedLessons = lessonsData.map((lesson, index) => {
    const progress = progressData.find((p) => p.lesson_id === lesson.id);

    let status: "locked" | "available" | "completed" = "locked";

    if (progress?.completed_at) {
      status = "completed";
    } else if (index === 0) {
      
      status = "available";
    } else {
      
      const prevLesson = lessonsData[index - 1];
      const prevProgress = progressData.find((p) => p.lesson_id === prevLesson.id);
      if (prevProgress?.completed_at) {
        status = "available";
      }
    }

    return {
      ...lesson,
      status,
      questions: [], 
    };
  });

  return {
    lessons: processedLessons,
    progress: progressData,
    isLoading,
    error: lessonsQuery.error || progressQuery.error,
    refetch: () => {
      lessonsQuery.refetch();
      progressQuery.refetch();
    }
  };
};
