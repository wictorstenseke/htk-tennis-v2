import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookingsApi } from "@/lib/api";
import { isFirebaseConfigured } from "@/lib/firebase";

import type { Booking, CreateBookingInput } from "@/types/api";

/**
 * Query keys for bookings
 */
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: () => [...bookingKeys.lists()] as const,
  byDate: (dateKey: string) => [...bookingKeys.all, "date", dateKey] as const,
};

/**
 * Hook to fetch all bookings from Firestore with live polling
 */
export const useBookingsQuery = () => {
  return useQuery({
    queryKey: bookingKeys.list(),
    queryFn: () => bookingsApi.getBookings(),
    staleTime: 0, // Always refetch on mount/focus
    refetchInterval: 30000, // Poll every 30 seconds for live updates
    enabled: isFirebaseConfigured,
  });
};

/**
 * Hook to fetch bookings for a specific date
 */
export const useBookingsByDateQuery = (dateKey: string) => {
  return useQuery({
    queryKey: bookingKeys.byDate(dateKey),
    queryFn: () => bookingsApi.getBookingsByDate(dateKey),
    enabled: isFirebaseConfigured && !!dateKey,
  });
};

/**
 * Hook to check availability for a time slot using cached bookings data
 * This avoids duplicate API calls by reusing the bookings query cache
 */
export const useCheckAvailability = (startDate: Date, endDate: Date) => {
  const { data: bookings, isLoading } = useBookingsQuery();

  // Compute availability from cached bookings using useMemo
  const availabilityData = useMemo(() => {
    if (!bookings) {
      return null;
    }

    return bookingsApi.checkAvailabilityFromBookings(
      startDate,
      endDate,
      bookings
    );
  }, [bookings, startDate, endDate]);

  return {
    data: availabilityData,
    isLoading,
    // Maintain compatibility with previous API but refetch is now a no-op
    // since availability is computed from bookings cache
    refetch: async () => ({ data: availabilityData }),
  };
};

/**
 * Hook to create a new booking
 */
export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingInput) => bookingsApi.createBooking(data),
    onMutate: async (newBooking) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: bookingKeys.all });

      // Snapshot the previous value
      const previousBookings = queryClient.getQueryData<Booking[]>(
        bookingKeys.list()
      );

      // Optimistically update to the new value
      const optimisticBooking: Booking = {
        id: `temp-${Date.now()}`,
        userId: newBooking.userId,
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (old = []) => {
        const updated = [optimisticBooking, ...old];
        // Sort by startDate descending
        return updated.sort((a, b) => {
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        });
      });

      // Also invalidate availability queries to reflect the new booking
      queryClient.invalidateQueries({
        queryKey: [...bookingKeys.all, "availability"],
      });

      // Return a context object with the snapshotted value
      return { previousBookings };
    },
    onError: (_err, _newBooking, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBookings) {
        queryClient.setQueryData(
          bookingKeys.list(),
          context.previousBookings
        );
      }
    },
    onSuccess: (data) => {
      // Replace the optimistic booking with the real one
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (old = []) => {
        // Remove the temporary booking and add the real one
        const withoutTemp = old.filter((b) => !b.id.startsWith("temp-"));
        const updated = [data, ...withoutTemp];
        // Sort by startDate descending
        return updated.sort((a, b) => {
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        });
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
};

/**
 * Hook to delete a booking
 */
export const useDeleteBookingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.deleteBooking(bookingId),
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey: bookingKeys.all });

      const previousBookings = queryClient.getQueryData<Booking[]>(
        bookingKeys.list()
      );

      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (old = []) =>
        old.filter((booking) => booking.id !== bookingId)
      );

      return { previousBookings };
    },
    onError: (_err, _bookingId, context) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(
          bookingKeys.list(),
          context.previousBookings
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
};
