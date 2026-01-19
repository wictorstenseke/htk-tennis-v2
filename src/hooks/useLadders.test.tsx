import { type ReactNode } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryClientProvider } from "@tanstack/react-query";

import { laddersApi } from "@/lib/api";
import { createTestQueryClient } from "@/test/utils";
import { createMockLadder } from "@/test/factories";

import {
  ladderKeys,
  useLaddersQuery,
  useActiveLadderQuery,
  useJoinLadderMutation,
  useLeaveLadderMutation,
} from "./useLadders";

import type { Ladder } from "@/types/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  laddersApi: {
    getLadders: vi.fn(),
    getActiveLadder: vi.fn(),
    joinLadder: vi.fn(),
    leaveLadder: vi.fn(),
  },
}));

describe("useLadders hooks", () => {
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

  describe("useLaddersQuery", () => {
    it("should fetch ladders successfully", async () => {
      const mockLadders = [
        createMockLadder({ id: "ladder-1", name: "Summer 2024" }),
        createMockLadder({ id: "ladder-2", name: "Fall 2024" }),
      ];
      vi.mocked(laddersApi.getLadders).mockResolvedValue(mockLadders);

      const { result } = renderHook(() => useLaddersQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockLadders);
      expect(laddersApi.getLadders).toHaveBeenCalled();
    });
  });

  describe("useActiveLadderQuery", () => {
    it("should fetch active ladder successfully", async () => {
      const mockActiveLadder = createMockLadder({
        id: "active-ladder",
        name: "Current Season",
        status: "active",
      });
      vi.mocked(laddersApi.getActiveLadder).mockResolvedValue(
        mockActiveLadder
      );

      const { result } = renderHook(() => useActiveLadderQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockActiveLadder);
      expect(laddersApi.getActiveLadder).toHaveBeenCalled();
    });

    it("should return null when no active ladder exists", async () => {
      vi.mocked(laddersApi.getActiveLadder).mockResolvedValue(null);

      const { result } = renderHook(() => useActiveLadderQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBe(null);
    });
  });

  describe("useJoinLadderMutation", () => {
    it("should join ladder with optimistic update", async () => {
      const mockLadder = createMockLadder({
        id: "ladder-1",
        participants: ["user-1"],
      });

      // Pre-populate cache
      queryClient.setQueryData(ladderKeys.detail("ladder-1"), mockLadder);
      queryClient.setQueryData(ladderKeys.active(), mockLadder);

      vi.mocked(laddersApi.joinLadder).mockResolvedValue(undefined);

      const { result } = renderHook(() => useJoinLadderMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ ladderId: "ladder-1", userId: "user-2" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(laddersApi.joinLadder).toHaveBeenCalledWith("ladder-1", "user-2");
    });

    it("should rollback optimistic update on error", async () => {
      const mockLadder = createMockLadder({
        id: "ladder-1",
        participants: ["user-1"],
      });

      // Pre-populate cache
      queryClient.setQueryData(ladderKeys.detail("ladder-1"), mockLadder);

      vi.mocked(laddersApi.joinLadder).mockRejectedValue(
        new Error("Join failed")
      );

      const { result } = renderHook(() => useJoinLadderMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ ladderId: "ladder-1", userId: "user-2" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(laddersApi.joinLadder).toHaveBeenCalledWith("ladder-1", "user-2");
    });
  });

  describe("useLeaveLadderMutation", () => {
    it("should leave ladder with optimistic update", async () => {
      const mockLadder = createMockLadder({
        id: "ladder-1",
        participants: ["user-1", "user-2"],
      });

      // Pre-populate cache
      queryClient.setQueryData(ladderKeys.detail("ladder-1"), mockLadder);
      queryClient.setQueryData(ladderKeys.active(), mockLadder);

      vi.mocked(laddersApi.leaveLadder).mockResolvedValue(undefined);

      const { result } = renderHook(() => useLeaveLadderMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ ladderId: "ladder-1", userId: "user-2" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(laddersApi.leaveLadder).toHaveBeenCalledWith(
        "ladder-1",
        "user-2"
      );
    });

    it("should rollback optimistic update on error", async () => {
      const mockLadder = createMockLadder({
        id: "ladder-1",
        participants: ["user-1", "user-2"],
      });

      // Pre-populate cache
      queryClient.setQueryData(ladderKeys.detail("ladder-1"), mockLadder);

      vi.mocked(laddersApi.leaveLadder).mockRejectedValue(
        new Error("Leave failed")
      );

      const { result } = renderHook(() => useLeaveLadderMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ ladderId: "ladder-1", userId: "user-2" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(laddersApi.leaveLadder).toHaveBeenCalledWith("ladder-1", "user-2");
    });
  });
});
