import { describe, expect, it } from "vitest";

import {
  applyLadderResult,
  getChallengeStatus,
  type LadderPlayer,
} from "@/lib/ladder";

describe("getChallengeStatus", () => {
  const ladder: LadderPlayer[] = [
    { id: "p1", name: "Player 1" },
    { id: "p2", name: "Player 2" },
    { id: "p3", name: "Player 3" },
    { id: "p4", name: "Player 4" },
    { id: "p5", name: "Player 5" },
    { id: "p6", name: "Player 6" },
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
    { id: "a", name: "Anna" },
    { id: "b", name: "Bjorn" },
    { id: "c", name: "Cecilia" },
    { id: "d", name: "David" },
    { id: "e", name: "Eva" },
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
