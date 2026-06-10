import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profileService";
import { Profile } from "@/types";

export const useProfile = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => profileService.getProfileByUserId(userId as string),
    enabled: !!userId,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => profileService.updateProfile(userId as string, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", userId], data);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
};
