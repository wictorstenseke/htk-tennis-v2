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

type UserStatsUpdate = Pick<User, "uid" | "ladderWins" | "ladderLosses">;
const hasStatsUpdates = (updates: UserStatsUpdate[]) => updates.length > 0;

const applyUserStatsUpdate = (user: User, update: UserStatsUpdate): User => {
  const updatedUser = { ...user };
  if (Object.hasOwn(update, "ladderWins")) {
    updatedUser.ladderWins = update.ladderWins;
  }
  if (Object.hasOwn(update, "ladderLosses")) {
    updatedUser.ladderLosses = update.ladderLosses;
  }
  return updatedUser;
};

const updateUsersWithStats = (users: User[], updates: UserStatsUpdate[]) => {
  const updatesMap = new Map(
    updates.map((update) => [update.uid, update] as const)
  );
  return users.map((user) => {
    const update = updatesMap.get(user.uid);
    return update ? applyUserStatsUpdate(user, update) : user;
  });
};

/**
 * Hook to update ladder stats for one or more users.
 */
export const useUpdateUserStatsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates }: { updates: UserStatsUpdate[] }) => {
      if (!hasStatsUpdates(updates)) {
        return [];
      }
      return Promise.all(
        updates.map((update) =>
          usersApi.updateUser(update.uid, {
            ladderWins: update.ladderWins,
            ladderLosses: update.ladderLosses,
          })
        )
      );
    },
    onMutate: async ({ updates }) => {
      if (!hasStatsUpdates(updates)) {
        return {
          skipped: true,
          previousUsers: undefined,
          previousDetails: new Map<string, User | undefined>(),
          previousCurrent: undefined,
        };
      }
      await queryClient.cancelQueries({ queryKey: userKeys.all });

      const previousUsers = queryClient.getQueryData<User[]>(userKeys.list());
      const previousDetails = new Map<string, User | undefined>();
      updates.forEach((update) => {
        previousDetails.set(
          update.uid,
          queryClient.getQueryData<User>(userKeys.detail(update.uid))
        );
      });
      const previousCurrent = queryClient.getQueryData<User | null>(
        userKeys.current()
      );

      queryClient.setQueryData<User[]>(userKeys.list(), (old = []) =>
        updateUsersWithStats(old, updates)
      );
      updates.forEach((update) => {
        queryClient.setQueryData<User | undefined>(
          userKeys.detail(update.uid),
          (old) => (old ? applyUserStatsUpdate(old, update) : old)
        );
      });
      queryClient.setQueryData<User | null>(userKeys.current(), (old) => {
        if (!old) {
          return old;
        }
        const update = updates.find((item) => item.uid === old.uid);
        return update ? applyUserStatsUpdate(old, update) : old;
      });

      return { previousUsers, previousDetails, previousCurrent };
    },
    onError: (_error, _variables, context) => {
      if (context?.skipped) {
        return;
      }
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.list(), context.previousUsers);
      }
      if (context?.previousDetails) {
        context.previousDetails.forEach((user, uid) => {
          queryClient.setQueryData(userKeys.detail(uid), user);
        });
      }
      if (Object.hasOwn(context ?? {}, "previousCurrent")) {
        queryClient.setQueryData(userKeys.current(), context?.previousCurrent);
      }
    },
    onSuccess: (updatedUsers) => {
      if (updatedUsers.length === 0) {
        return;
      }
      queryClient.setQueryData<User[]>(userKeys.list(), (old = []) => {
        const updatedUsersById = new Map(
          updatedUsers.map((user) => [user.uid, user] as const)
        );
        return old.map((user) => updatedUsersById.get(user.uid) ?? user);
      });
      updatedUsers.forEach((user) => {
        queryClient.setQueryData(userKeys.detail(user.uid), user);
      });
      queryClient.setQueryData<User | null>(userKeys.current(), (old) => {
        if (!old) {
          return old;
        }
        const updated = updatedUsers.find((user) => user.uid === old.uid);
        return updated ?? old;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
