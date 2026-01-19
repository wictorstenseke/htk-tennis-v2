import { type ReactNode } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryClientProvider } from "@tanstack/react-query";

import { bookingsApi } from "@/lib/api";
import { bookingKeys } from "@/hooks/useBookings";
import { createTestQueryClient } from "@/test/utils";
import { createMockLadderMatch } from "@/test/factories";

import {
  useUpdateLadderMatchMutation,
  useDeleteLadderMatchMutation,
} from "./useLadderMatches";

import type { LadderStatus } from "@/types/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  bookingsApi: {
    updateLadderMatch: vi.fn(),
    deleteBooking: vi.fn(),
    getBookings: vi.fn(),
  },
}));

// Mock Firebase configuration
vi.mock("@/lib/firebase", () => ({
  isFirebaseConfigured: true,
}));

describe("useLadderMatches hooks", () => {
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

  describe("useUpdateLadderMatchMutation", () => {
    it("should update ladder match status", async () => {
      const mockBooking = createMockLadderMatch({
        id: "match-1",
        ladderStatus: "planned",
      });

      // Pre-populate cache
      queryClient.setQueryData(bookingKeys.list(), [mockBooking]);

      const updates = {
        ladderStatus: "completed" as LadderStatus,
        winnerId: "player-a",
      };

      vi.mocked(bookingsApi.updateLadderMatch).mockResolvedValue({
        id: "match-1",
        ...updates,
      });

      const { result } = renderHook(() => useUpdateLadderMatchMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ bookingId: "match-1", updates });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(bookingsApi.updateLadderMatch).toHaveBeenCalledWith(
        "match-1",
        updates
      );
    });

    it("should rollback optimistic update on error", async () => {
      const mockBooking = createMockLadderMatch({
        id: "match-1",
        ladderStatus: "planned",
      });

      // Pre-populate cache
      queryClient.setQueryData(bookingKeys.list(), [mockBooking]);

      const updates = {
        ladderStatus: "completed" as LadderStatus,
        winnerId: "player-a",
      };

      vi.mocked(bookingsApi.updateLadderMatch).mockRejectedValue(
        new Error("Update failed")
      );

      const { result } = renderHook(() => useUpdateLadderMatchMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ bookingId: "match-1", updates });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(bookingsApi.updateLadderMatch).toHaveBeenCalledWith(
        "match-1",
        updates
      );
    });

    it("should update match winner and comment", async () => {
      const mockBooking = createMockLadderMatch({
        id: "match-1",
        ladderStatus: "completed",
        winnerId: "player-a",
      });

      // Pre-populate cache
      queryClient.setQueryData(bookingKeys.list(), [mockBooking]);

      const updates = {
        winnerId: "player-b",
        comment: "Great match!",
      };

      vi.mocked(bookingsApi.updateLadderMatch).mockResolvedValue({
        id: "match-1",
        ...updates,
      });

      const { result } = renderHook(() => useUpdateLadderMatchMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ bookingId: "match-1", updates });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(bookingsApi.updateLadderMatch).toHaveBeenCalledWith(
        "match-1",
        updates
      );
    });
  });

  describe("useDeleteLadderMatchMutation", () => {
    it("should delete ladder match", async () => {
      const mockBooking1 = createMockLadderMatch({
        id: "match-1",
      });
      const mockBooking2 = createMockLadderMatch({
        id: "match-2",
      });

      // Pre-populate cache
      queryClient.setQueryData(bookingKeys.list(), [
        mockBooking1,
        mockBooking2,
      ]);

      vi.mocked(bookingsApi.deleteBooking).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteLadderMatchMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("match-1");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(bookingsApi.deleteBooking).toHaveBeenCalledWith("match-1");
    });

    it("should rollback optimistic update on error", async () => {
      const mockBooking1 = createMockLadderMatch({
        id: "match-1",
      });
      const mockBooking2 = createMockLadderMatch({
        id: "match-2",
      });

      // Pre-populate cache
      queryClient.setQueryData(bookingKeys.list(), [
        mockBooking1,
        mockBooking2,
      ]);

      vi.mocked(bookingsApi.deleteBooking).mockRejectedValue(
        new Error("Delete failed")
      );

      const { result } = renderHook(() => useDeleteLadderMatchMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("match-1");

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(bookingsApi.deleteBooking).toHaveBeenCalledWith("match-1");
    });
  });
});
