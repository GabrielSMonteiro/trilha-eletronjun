import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types";

export const categoriesService = {
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }

    return data || [];
  }
};
