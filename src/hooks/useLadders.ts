import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { laddersApi } from "@/lib/api";

import type { Ladder } from "@/types/api";

export const ladderKeys = {
  all: ["ladders"] as const,
  lists: () => [...ladderKeys.all, "list"] as const,
  list: () => [...ladderKeys.lists()] as const,
  details: () => [...ladderKeys.all, "detail"] as const,
  detail: (id: string) => [...ladderKeys.details(), id] as const,
  active: () => [...ladderKeys.all, "active"] as const,
};

export const useLaddersQuery = () => {
  return useQuery({
    queryKey: ladderKeys.list(),
    queryFn: () => laddersApi.getLadders(),
  });
};

export const useActiveLadderQuery = () => {
  return useQuery({
    queryKey: ladderKeys.active(),
    queryFn: () => laddersApi.getActiveLadder(),
  });
};

export const useLadderQuery = (ladderId: string) => {
  return useQuery({
    queryKey: ladderKeys.detail(ladderId),
    queryFn: () => laddersApi.getLadder(ladderId),
    enabled: !!ladderId,
  });
};

export const useJoinLadderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ladderId,
      userId,
    }: {
      ladderId: string;
      userId: string;
    }) => laddersApi.joinLadder(ladderId, userId),
    onMutate: async ({ ladderId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ladderKeys.all });
      const previousLadder = queryClient.getQueryData<Ladder>(
        ladderKeys.detail(ladderId)
      );
      const previousActiveLadder = queryClient.getQueryData<Ladder | null>(
        ladderKeys.active()
      );

      queryClient.setQueryData<Ladder>(ladderKeys.detail(ladderId), (old) => {
        if (!old) return old;
        return {
          ...old,
          participants: [...old.participants, userId],
        };
      });

      queryClient.setQueryData<Ladder | null>(
        ladderKeys.active(),
        (old) => {
          if (!old || old.id !== ladderId) return old;
          return {
            ...old,
            participants: [...old.participants, userId],
          };
        }
      );

      return { previousLadder, previousActiveLadder };
    },
    onError: (_error, { ladderId }, context) => {
      if (context?.previousLadder) {
        queryClient.setQueryData(
          ladderKeys.detail(ladderId),
          context.previousLadder
        );
      }
      if (context?.previousActiveLadder) {
        queryClient.setQueryData(
          ladderKeys.active(),
          context.previousActiveLadder
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
};

export const useLeaveLadderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ladderId,
      userId,
    }: {
      ladderId: string;
      userId: string;
    }) => laddersApi.leaveLadder(ladderId, userId),
    onMutate: async ({ ladderId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ladderKeys.all });
      const previousLadder = queryClient.getQueryData<Ladder>(
        ladderKeys.detail(ladderId)
      );
      const previousActiveLadder = queryClient.getQueryData<Ladder | null>(
        ladderKeys.active()
      );

      queryClient.setQueryData<Ladder>(ladderKeys.detail(ladderId), (old) => {
        if (!old) return old;
        return {
          ...old,
          participants: old.participants.filter((id) => id !== userId),
        };
      });

      queryClient.setQueryData<Ladder | null>(
        ladderKeys.active(),
        (old) => {
          if (!old || old.id !== ladderId) return old;
          return {
            ...old,
            participants: old.participants.filter((id) => id !== userId),
          };
        }
      );

      return { previousLadder, previousActiveLadder };
    },
    onError: (_error, { ladderId }, context) => {
      if (context?.previousLadder) {
        queryClient.setQueryData(
          ladderKeys.detail(ladderId),
          context.previousLadder
        );
      }
      if (context?.previousActiveLadder) {
        queryClient.setQueryData(
          ladderKeys.active(),
          context.previousActiveLadder
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
};

export const useCreateLadderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ladder: Omit<Ladder, "id" | "createdAt">) =>
      laddersApi.createLadder(ladder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
};

export const useArchiveLadderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ladderId: string) => laddersApi.archiveLadder(ladderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
};
