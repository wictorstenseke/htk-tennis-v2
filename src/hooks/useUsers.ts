import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { usersApi } from "@/lib/api";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

import type { User } from "@/types/api";

/**
 * Query keys for users
 */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (uid: string) => [...userKeys.details(), uid] as const,
  current: () => [...userKeys.all, "current"] as const,
};

/**
 * Hook to fetch a list of users from Firestore
 */
export const useUsersQuery = () => {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => usersApi.getUsers(),
    enabled: isFirebaseConfigured,
  });
};

/**
 * Hook to fetch a single user by UID
 */
export const useUserQuery = (uid: string) => {
  return useQuery({
    queryKey: userKeys.detail(uid),
    queryFn: () => usersApi.getUser(uid),
    enabled: isFirebaseConfigured && uid.length > 0,
  });
};

/**
 * Hook to fetch current authenticated user's full document from Firestore
 */
export const useCurrentUserQuery = () => {
  const currentAuthUser = auth?.currentUser;

  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      if (!currentAuthUser?.uid) {
        return null;
      }
      try {
        return await usersApi.getUser(currentAuthUser.uid);
      } catch {
        return null;
      }
    },
    enabled: isFirebaseConfigured && !!currentAuthUser?.uid,
  });
};

/**
 * Hook to update user data
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, updates }: { uid: string; updates: Partial<User> }) =>
      usersApi.updateUser(uid, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.uid) });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
};
