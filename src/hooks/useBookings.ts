import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookingsApi } from "@/lib/api";

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
 * Hook to fetch all bookings from Firestore
 */
export const useBookingsQuery = () => {
  return useQuery({
    queryKey: bookingKeys.list(),
    queryFn: () => bookingsApi.getBookings(),
  });
};

/**
 * Hook to fetch bookings for a specific date
 */
export const useBookingsByDateQuery = (dateKey: string) => {
  return useQuery({
    queryKey: bookingKeys.byDate(dateKey),
    queryFn: () => bookingsApi.getBookingsByDate(dateKey),
    enabled: !!dateKey,
  });
};

/**
 * Hook to check availability for a time slot
 */
export const useCheckAvailability = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: [...bookingKeys.all, "availability", startDate.toISOString(), endDate.toISOString()],
    queryFn: () => bookingsApi.checkAvailability(startDate, endDate),
    enabled: !!startDate && !!endDate && endDate > startDate,
    staleTime: 0,
    gcTime: 0,
  });
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
