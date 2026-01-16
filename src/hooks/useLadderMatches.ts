import { useEffect, useMemo } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { bookingKeys, useBookingsQuery } from "@/hooks/useBookings";
import { bookingsApi } from "@/lib/api";
import { bookingToLadderMatch, type LadderMatch } from "@/lib/ladder";

import type { Booking } from "@/types/api";

export const ladderMatchKeys = {
  all: [...bookingKeys.all, "ladder"] as const,
  lists: () => [...ladderMatchKeys.all, "list"] as const,
  list: () => [...ladderMatchKeys.lists()] as const,
};

const isLadderMatch = (match: LadderMatch | null): match is LadderMatch =>
  match !== null;

const buildLadderMatches = (bookings: Booking[] | undefined): LadderMatch[] =>
  (bookings ?? [])
    .map(bookingToLadderMatch)
    .filter(isLadderMatch)
    .sort((a, b) => {
      const aTime = a.bookingStart ? new Date(a.bookingStart).getTime() : 0;
      const bTime = b.bookingStart ? new Date(b.bookingStart).getTime() : 0;
      return bTime - aTime;
    });

export const useLadderMatchesQuery = () => {
  const bookingsQuery = useBookingsQuery();
  const queryClient = useQueryClient();
  const ladderMatches = useMemo(
    () => buildLadderMatches(bookingsQuery.data),
    [bookingsQuery.data]
  );

  useEffect(() => {
    const cachedMatches = queryClient.getQueryData<LadderMatch[]>(
      ladderMatchKeys.list()
    );
    if (cachedMatches !== ladderMatches) {
      queryClient.setQueryData(ladderMatchKeys.list(), ladderMatches);
    }
  }, [queryClient, ladderMatches]);

  return {
    ...bookingsQuery,
    data: ladderMatches,
  };
};

const updateLadderMatchCache = (
  match: LadderMatch,
  updates: Partial<Pick<Booking, "ladderStatus" | "winnerId" | "comment">>
): LadderMatch => ({
  ...match,
  status: updates.ladderStatus ?? match.status,
  winnerId: updates.winnerId ?? match.winnerId,
  comment: updates.comment ?? match.comment,
});

const updateBookingList = (
  bookings: Booking[],
  bookingId: string,
  updates: Partial<Pick<Booking, "ladderStatus" | "winnerId" | "comment">>
) =>
  bookings.map((booking) =>
    booking.id === bookingId ? { ...booking, ...updates } : booking
  );

const updateLadderMatchList = (
  matches: LadderMatch[],
  bookingId: string,
  updates: Partial<Pick<Booking, "ladderStatus" | "winnerId" | "comment">>
) =>
  matches.map((match) =>
    match.id === bookingId || match.bookingId === bookingId
      ? updateLadderMatchCache(match, updates)
      : match
  );

export const useUpdateLadderMatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      updates,
    }: {
      bookingId: string;
      updates: Partial<Pick<Booking, "ladderStatus" | "winnerId" | "comment">>;
    }) => bookingsApi.updateLadderMatch(bookingId, updates),
    onMutate: async ({ bookingId, updates }) => {
      await queryClient.cancelQueries({ queryKey: bookingKeys.all });
      const previousBookings = queryClient.getQueryData<Booking[]>(
        bookingKeys.list()
      );
      const previousMatches = queryClient.getQueryData<LadderMatch[]>(
        ladderMatchKeys.list()
      );

      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (old = []) =>
        updateBookingList(old, bookingId, updates)
      );
      queryClient.setQueryData<LadderMatch[]>(ladderMatchKeys.list(), (old = []) =>
        updateLadderMatchList(old, bookingId, updates)
      );

      return { previousBookings, previousMatches };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(bookingKeys.list(), context.previousBookings);
      }
      if (context?.previousMatches) {
        queryClient.setQueryData(ladderMatchKeys.list(), context.previousMatches);
      }
    },
    onSuccess: (updatedMatch) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (old = []) =>
        updateBookingList(old, updatedMatch.id, updatedMatch)
      );
      queryClient.setQueryData<LadderMatch[]>(ladderMatchKeys.list(), (old = []) =>
        updateLadderMatchList(old, updatedMatch.id, updatedMatch)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: ladderMatchKeys.all });
    },
  });
};

export const useDeleteLadderMatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.deleteBooking(bookingId),
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: bookingKeys.all });
      const previousBookings = queryClient.getQueryData<Booking[]>(
        bookingKeys.list()
      );
      const previousMatches = queryClient.getQueryData<LadderMatch[]>(
        ladderMatchKeys.list()
      );

      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (old = []) =>
        old.filter((booking) => booking.id !== bookingId)
      );
      queryClient.setQueryData<LadderMatch[]>(ladderMatchKeys.list(), (old = []) =>
        old.filter(
          (match) => match.id !== bookingId && match.bookingId !== bookingId
        )
      );

      return { previousBookings, previousMatches };
    },
    onError: (_error, _bookingId, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(bookingKeys.list(), context.previousBookings);
      }
      if (context?.previousMatches) {
        queryClient.setQueryData(ladderMatchKeys.list(), context.previousMatches);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      queryClient.invalidateQueries({ queryKey: ladderMatchKeys.all });
    },
  });
};
