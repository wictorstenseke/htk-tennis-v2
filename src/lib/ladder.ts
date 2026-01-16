import type { User as AuthUser } from "@/lib/auth";
import type { User } from "@/types/api";

export interface LadderPlayer {
  id: string;
  name: string;
}

export type ChallengeReason = "self" | "lower-ranked" | "too-far" | "missing";

export interface ChallengeStatus {
  eligible: boolean;
  reason?: ChallengeReason;
}

export interface LadderMatch {
  id: string;
  playerAId: string;
  playerBId: string;
  bookingId?: string;
  bookingStart?: string;
  bookingEnd?: string;
  court?: string;
  status: "planned" | "completed";
  winnerId?: string;
  comment?: string;
}

export const mockLadderPlayers: LadderPlayer[] = [
  { id: "mock-1", name: "Elin Andersson" },
  { id: "mock-2", name: "Johan Larsson" },
  { id: "mock-3", name: "Sara Nilsson" },
  { id: "mock-4", name: "Oskar Svensson" },
  { id: "mock-5", name: "Lina Berg" },
  { id: "mock-6", name: "Erik Persson" },
  { id: "mock-7", name: "Maja Lind" },
  { id: "mock-8", name: "Victor Holm" },
];

const getPlayerName = (user: User | AuthUser): string => {
  return user.displayName || user.email?.split("@")[0] || "Spelare";
};

export const buildLadderPlayers = (
  users: User[] | undefined,
  currentUser: AuthUser | null
): LadderPlayer[] => {
  const mappedUsers =
    users && users.length > 0
      ? users.map((user) => ({
          id: user.uid,
          name: getPlayerName(user),
        }))
      : [...mockLadderPlayers];

  const sortedPlayers = [...mappedUsers].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );

  if (!currentUser) {
    return sortedPlayers;
  }

  const currentPlayerId = currentUser.uid;
  if (sortedPlayers.some((player) => player.id === currentPlayerId)) {
    return sortedPlayers;
  }

  return [
    ...sortedPlayers,
    { id: currentPlayerId, name: getPlayerName(currentUser) },
  ];
};

export const getChallengeStatus = (
  ladder: LadderPlayer[],
  challengerId: string,
  opponentId: string
): ChallengeStatus => {
  if (challengerId === opponentId) {
    return { eligible: false, reason: "self" };
  }

  const challengerIndex = ladder.findIndex(
    (player) => player.id === challengerId
  );
  const opponentIndex = ladder.findIndex((player) => player.id === opponentId);

  if (challengerIndex === -1 || opponentIndex === -1) {
    return { eligible: false, reason: "missing" };
  }

  const positionDifference = challengerIndex - opponentIndex;
  if (positionDifference <= 0) {
    return { eligible: false, reason: "lower-ranked" };
  }

  if (positionDifference > 4) {
    return { eligible: false, reason: "too-far" };
  }

  return { eligible: true };
};

export const applyLadderResult = (
  ladder: LadderPlayer[],
  winnerId: string,
  loserId: string
): LadderPlayer[] => {
  const winnerIndex = ladder.findIndex((player) => player.id === winnerId);
  const loserIndex = ladder.findIndex((player) => player.id === loserId);

  if (winnerIndex === -1 || loserIndex === -1 || winnerIndex === loserIndex) {
    return ladder;
  }

  if (winnerIndex < loserIndex) {
    return ladder;
  }

  const updated = [...ladder];
  const [winner] = updated.splice(winnerIndex, 1);
  updated.splice(loserIndex, 0, winner);
  return updated;
};
