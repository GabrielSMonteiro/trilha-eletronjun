import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "@/services/categoriesService";

export const useCategories = () => {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesService.getAllCategories(),
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
