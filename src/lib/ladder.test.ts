import { describe, expect, it } from "vitest";

import {
  applyLadderResult,
  formatPlayerStats,
  getChallengeStatus,
  type LadderPlayer,
  updatePlayerStats,
} from "@/lib/ladder";

describe("getChallengeStatus", () => {
  const ladder: LadderPlayer[] = [
    { id: "p1", name: "Player 1", wins: 0, losses: 0 },
    { id: "p2", name: "Player 2", wins: 0, losses: 0 },
    { id: "p3", name: "Player 3", wins: 0, losses: 0 },
    { id: "p4", name: "Player 4", wins: 0, losses: 0 },
    { id: "p5", name: "Player 5", wins: 0, losses: 0 },
    { id: "p6", name: "Player 6", wins: 0, losses: 0 },
  ];

  it("should allow challenges when the opponent is within four positions above", () => {
    const status = getChallengeStatus(ladder, "p6", "p3");

    expect(status.eligible).toBe(true);
  });

  it("should reject challenges when the opponent is beyond four positions above", () => {
    const status = getChallengeStatus(ladder, "p6", "p1");

    expect(status.eligible).toBe(false);
    expect(status.reason).toBe("too-far");
  });
});

describe("applyLadderResult", () => {
  const ladder: LadderPlayer[] = [
    { id: "a", name: "Anna", wins: 2, losses: 1 },
    { id: "b", name: "Bjorn", wins: 1, losses: 3 },
    { id: "c", name: "Cecilia", wins: 4, losses: 0 },
    { id: "d", name: "David", wins: 0, losses: 2 },
    { id: "e", name: "Eva", wins: 3, losses: 2 },
  ];

  it("should move the lower-ranked winner to the loser's position when the winner is below", () => {
    const updated = applyLadderResult(ladder, "e", "b");

    expect(updated.map((player) => player.id)).toEqual([
      "a",
      "e",
      "b",
      "c",
      "d",
    ]);
  });

  it("should keep the ladder unchanged when the winner is already above the loser", () => {
    const updated = applyLadderResult(ladder, "b", "e");

    expect(updated.map((player) => player.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });
});

describe("updatePlayerStats", () => {
  it("should increment wins and losses for the winner and loser", () => {
    const ladder: LadderPlayer[] = [
      { id: "winner", name: "Winner", wins: 1, losses: 0 },
      { id: "loser", name: "Loser", wins: 2, losses: 3 },
    ];

    const updated = updatePlayerStats(ladder, "winner", "loser");

    expect(updated).toEqual([
      { id: "winner", name: "Winner", wins: 2, losses: 0 },
      { id: "loser", name: "Loser", wins: 2, losses: 4 },
    ]);
  });
});

describe("formatPlayerStats", () => {
  it("should format wins and losses using an en dash", () => {
    const stats = formatPlayerStats({ wins: 3, losses: 1 });

    expect(stats).toBe("3–1");
  });
});
