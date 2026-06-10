import { supabase } from "@/integrations/supabase/client";
import { Lesson, UserProgress } from "@/types";

export const lessonsService = {
  async getLessonsByCategory(categoryName: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id,
        title,
        description,
        video_url,
        external_link,
        order_index,
        category_id,
        categories!inner(name)
      `)
      .eq("categories.name", categoryName)
      .order("order_index");

    if (error) {
      console.error("Error fetching lessons:", error);
      throw error;
    }

    return (data || []) as Lesson[];
  },

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from("user_progress")
      .select("lesson_id, completed_at, score")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user progress:", error);
      throw error;
    }

    return data || [];
  }
};
