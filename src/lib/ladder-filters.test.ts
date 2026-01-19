import { describe, expect, it } from "vitest";

import { buildLadderPlayers, type LadderPlayer } from "@/lib/ladder";

import type { User as AuthUser } from "@/lib/auth";
import type { User } from "@/types/api";

describe("buildLadderPlayers with participant filtering", () => {
  const mockUsers: User[] = [
    {
      uid: "user1",
      email: "alice@example.com",
      displayName: "Alice",
      ladderWins: 5,
      ladderLosses: 2,
    },
    {
      uid: "user2",
      email: "bob@example.com",
      displayName: "Bob",
      ladderWins: 3,
      ladderLosses: 4,
    },
    {
      uid: "user3",
      email: "charlie@example.com",
      displayName: "Charlie",
      ladderWins: 1,
      ladderLosses: 1,
    },
  ];

  const mockCurrentUser: AuthUser = {
    uid: "user2",
    email: "bob@example.com",
    displayName: "Bob",
  };

  it("should return all users when no participant filter is provided", () => {
    const result = buildLadderPlayers(mockUsers, mockCurrentUser);

    expect(result).toHaveLength(3);
    expect(result.map((p) => p.id)).toContain("user1");
    expect(result.map((p) => p.id)).toContain("user2");
    expect(result.map((p) => p.id)).toContain("user3");
  });

  it("should filter users by participant IDs", () => {
    const participants = ["user1", "user3"];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toContain("user1");
    expect(result.map((p) => p.id)).toContain("user3");
    expect(result.map((p) => p.id)).not.toContain("user2");
  });

  it("should include current user if they are in participants", () => {
    const participants = ["user1", "user2"];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toContain("user1");
    expect(result.map((p) => p.id)).toContain("user2");
  });

  it("should exclude current user if they are not in participants", () => {
    const participants = ["user1", "user3"];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).not.toContain("user2");
  });

  it("should preserve player stats when filtering", () => {
    const participants = ["user1"];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "user1",
      name: "Alice",
      wins: 5,
      losses: 2,
    });
  });

  it("should sort filtered players alphabetically by name", () => {
    const participants = ["user3", "user1"];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
    expect(result[1].name).toBe("Charlie");
  });

  it("should handle empty participant list as no filter", () => {
    const participants: string[] = [];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    // Empty array should be treated as no filter, returning all users
    expect(result).toHaveLength(3);
  });

  it("should handle participants with no matching users", () => {
    const participants = ["nonexistent1", "nonexistent2"];
    const result = buildLadderPlayers(mockUsers, mockCurrentUser, participants);

    expect(result).toHaveLength(0);
  });
});
