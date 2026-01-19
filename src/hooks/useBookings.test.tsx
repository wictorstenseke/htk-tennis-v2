import { type ReactNode } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryClientProvider } from "@tanstack/react-query";

import { bookingsApi } from "@/lib/api";
import { createTestQueryClient } from "@/test/utils";
import { createMockBooking } from "@/test/factories";

import {
  bookingKeys,
  useBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
} from "./useBookings";

import type { Booking } from "@/types/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  bookingsApi: {
    getBookings: vi.fn(),
    getBookingsByDate: vi.fn(),
    createBooking: vi.fn(),
    deleteBooking: vi.fn(),
    checkAvailabilityFromBookings: vi.fn(),
  },
}));

// Mock Firebase configuration
vi.mock("@/lib/firebase", () => ({
  isFirebaseConfigured: true,
}));

describe("useBookings hooks", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  describe("useBookingsQuery", () => {
    it("should fetch bookings successfully", async () => {
      const mockBookings = [
        createMockBooking({ id: "booking-1" }),
        createMockBooking({ id: "booking-2" }),
      ];
      vi.mocked(bookingsApi.getBookings).mockResolvedValue(mockBookings);

      const { result } = renderHook(() => useBookingsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockBookings);
      expect(bookingsApi.getBookings).toHaveBeenCalled();
    });
  });

  describe("useCreateBookingMutation", () => {
    it("should create booking with optimistic update", async () => {
      const newBookingInput = {
        userId: "user-123",
        startDate: new Date("2024-01-15T10:00:00Z").toISOString(),
        endDate: new Date("2024-01-15T12:00:00Z").toISOString(),
      };
      const createdBooking = createMockBooking({
        id: "real-booking-id",
        ...newBookingInput,
      });

      // Pre-populate cache with existing bookings
      const existingBookings = [createMockBooking({ id: "existing-1" })];
      queryClient.setQueryData(bookingKeys.list(), existingBookings);

      vi.mocked(bookingsApi.createBooking).mockResolvedValue(createdBooking);

      const { result } = renderHook(() => useCreateBookingMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newBookingInput);

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check that booking was created successfully
      expect(bookingsApi.createBooking).toHaveBeenCalledWith(newBookingInput);
      expect(result.current.data).toEqual(createdBooking);
    });

    it("should rollback optimistic update on error", async () => {
      const newBookingInput = {
        userId: "user-123",
        startDate: new Date("2024-01-15T10:00:00Z").toISOString(),
        endDate: new Date("2024-01-15T12:00:00Z").toISOString(),
      };

      // Pre-populate cache with existing bookings
      const existingBookings = [createMockBooking({ id: "existing-1" })];
      queryClient.setQueryData(bookingKeys.list(), existingBookings);

      vi.mocked(bookingsApi.createBooking).mockRejectedValue(
        new Error("Booking conflict")
      );

      const { result } = renderHook(() => useCreateBookingMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newBookingInput);

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify mutation was called
      expect(bookingsApi.createBooking).toHaveBeenCalledWith(newBookingInput);
    });
  });

  describe("useDeleteBookingMutation", () => {
    it("should delete booking with optimistic update", async () => {
      const bookingToDelete = createMockBooking({ id: "booking-to-delete" });
      const remainingBooking = createMockBooking({ id: "remaining-booking" });

      // Pre-populate cache
      queryClient.setQueryData(bookingKeys.list(), [
        bookingToDelete,
        remainingBooking,
      ]);

      vi.mocked(bookingsApi.deleteBooking).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteBookingMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("booking-to-delete");

      // Check optimistic update - booking should be removed immediately
      await waitFor(() => {
        const cached = queryClient.getQueryData<Booking[]>(bookingKeys.list());
        expect(cached).toBeDefined();
        expect(cached!.length).toBe(1);
        expect(cached![0].id).toBe("remaining-booking");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(bookingsApi.deleteBooking).toHaveBeenCalledWith(
        "booking-to-delete"
      );
    });

    it("should rollback optimistic update on error", async () => {
      const bookingToDelete = createMockBooking({ id: "booking-to-delete" });
      const remainingBooking = createMockBooking({ id: "remaining-booking" });

      // Pre-populate cache
      const originalBookings = [bookingToDelete, remainingBooking];
      queryClient.setQueryData(bookingKeys.list(), originalBookings);

      vi.mocked(bookingsApi.deleteBooking).mockRejectedValue(
        new Error("Delete failed")
      );

      const { result } = renderHook(() => useDeleteBookingMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("booking-to-delete");

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Verify mutation was called
      expect(bookingsApi.deleteBooking).toHaveBeenCalledWith(
        "booking-to-delete"
      );
    });
  });
});
