import { useQuery } from "@tanstack/react-query";

import { usersApi } from "@/lib/api";
import { isFirebaseConfigured } from "@/lib/firebase";

/**
 * Query keys for users
 */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: () => [...userKeys.lists()] as const,
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
