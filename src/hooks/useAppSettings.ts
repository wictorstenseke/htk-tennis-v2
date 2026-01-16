import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "@/lib/api";
import { isFirebaseConfigured } from "@/lib/firebase";

import type { AppSettings } from "@/types/api";

/**
 * Query keys for app settings
 */
export const appSettingsKeys = {
  all: ["appSettings"] as const,
  detail: () => [...appSettingsKeys.all, "default"] as const,
};

/**
 * Hook to fetch app settings
 */
export const useAppSettingsQuery = () => {
  return useQuery({
    queryKey: appSettingsKeys.detail(),
    queryFn: () => appSettingsApi.getAppSettings(),
    enabled: isFirebaseConfigured,
  });
};

/**
 * Hook to update app settings
 */
export const useUpdateAppSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<AppSettings>) =>
      appSettingsApi.updateAppSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appSettingsKeys.detail() });
    },
  });
};
