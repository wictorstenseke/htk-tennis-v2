import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { announcementsApi } from "@/lib/api";
import { isFirebaseConfigured } from "@/lib/firebase";

import type { Announcement } from "@/types/api";

/**
 * Query keys for announcements
 */
export const announcementKeys = {
  all: ["announcements"] as const,
  detail: () => [...announcementKeys.all, "main"] as const,
};

/**
 * Hook to fetch announcement
 */
export const useAnnouncementQuery = () => {
  return useQuery({
    queryKey: announcementKeys.detail(),
    queryFn: () => announcementsApi.getAnnouncement(),
    enabled: isFirebaseConfigured,
  });
};

/**
 * Hook to update announcement
 */
export const useUpdateAnnouncementMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Announcement>) =>
      announcementsApi.updateAnnouncement(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail() });
    },
  });
};
