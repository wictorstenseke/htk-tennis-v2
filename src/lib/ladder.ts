import type { User as AuthUser } from "@/lib/auth";
import type { Booking, User } from "@/types/api";

export interface LadderPlayer {
  id: string;
  name: string;
  wins: number;
  losses: number;
}

export type ChallengeReason = "self" | "lower-ranked" | "too-far" | "missing";

const fallbackPlayerName = "Spelare";
const maxChallengeDistance = 4;

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
  status: "planned" | "completed";
  winnerId?: string;
  comment?: string;
}

export const mockLadderPlayers: LadderPlayer[] = [
  { id: "mock-1", name: "Elin Andersson", wins: 0, losses: 0 },
  { id: "mock-2", name: "Johan Larsson", wins: 0, losses: 0 },
  { id: "mock-3", name: "Sara Nilsson", wins: 0, losses: 0 },
  { id: "mock-4", name: "Oskar Svensson", wins: 0, losses: 0 },
  { id: "mock-5", name: "Lina Berg", wins: 0, losses: 0 },
  { id: "mock-6", name: "Erik Persson", wins: 0, losses: 0 },
  { id: "mock-7", name: "Maja Lind", wins: 0, losses: 0 },
  { id: "mock-8", name: "Victor Holm", wins: 0, losses: 0 },
];

const getPlayerName = (user: User | AuthUser): string => {
  const email = typeof user.email === "string" ? user.email.trim() : "";
  const emailName = email ? email.split("@")[0] : "";
  return user.displayName || emailName || fallbackPlayerName;
};

const getPlayerStats = (user?: User) => ({
  wins: typeof user?.ladderWins === "number" ? user.ladderWins : 0,
  losses: typeof user?.ladderLosses === "number" ? user.ladderLosses : 0,
});

const resolveLadderMatchIndices = (
  ladder: LadderPlayer[],
  winnerId: string,
  loserId: string
) => {
  const winnerIndex = ladder.findIndex((player) => player.id === winnerId);
  const loserIndex = ladder.findIndex((player) => player.id === loserId);

  if (winnerIndex === -1 || loserIndex === -1 || winnerIndex === loserIndex) {
    return null;
  }

  return { winnerIndex, loserIndex };
};

const isInvalidMatchResult = (winnerId: string, loserId: string) => {
  if (winnerId !== loserId) {
    return false;
  }

  console.warn("Invalid ladder result: winner and loser match the same player.", {
    winnerId,
    loserId,
  });
  return true;
};

export const buildLadderPlayers = (
  users: User[] | undefined,
  currentUser: AuthUser | null,
  participantIds?: string[]
): LadderPlayer[] => {
  const mappedUsers =
    users && users.length > 0
      ? users.map((user) => ({
          id: user.uid,
          name: getPlayerName(user),
          ...getPlayerStats(user),
        }))
      : mockLadderPlayers;

  let filteredUsers = mappedUsers;
  if (participantIds && participantIds.length > 0) {
    const participantSet = new Set(participantIds);
    filteredUsers = mappedUsers.filter((user) => participantSet.has(user.id));
  }

  const sortedPlayers = [...filteredUsers].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );

  if (!currentUser) {
    return sortedPlayers;
  }

  const currentPlayerId = currentUser.uid;
  const currentUserInList = sortedPlayers.some((player) => player.id === currentPlayerId);
  
  if (currentUserInList) {
    return sortedPlayers;
  }

  const shouldIncludeCurrentUser = !participantIds || 
    participantIds.length === 0 || 
    participantIds.includes(currentPlayerId);

  if (shouldIncludeCurrentUser) {
    return [
      ...sortedPlayers,
      { id: currentPlayerId, name: getPlayerName(currentUser), wins: 0, losses: 0 },
    ];
  }

  return sortedPlayers;
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

  if (positionDifference > maxChallengeDistance) {
    return { eligible: false, reason: "too-far" };
  }

  return { eligible: true };
};

export const applyLadderResult = (
  ladder: LadderPlayer[],
  winnerId: string,
  loserId: string
): LadderPlayer[] => {
  const matchIndices = resolveLadderMatchIndices(ladder, winnerId, loserId);
  if (!matchIndices) {
    return ladder;
  }

  const { winnerIndex, loserIndex } = matchIndices;
  if (winnerIndex < loserIndex) {
    return ladder;
  }

  const updated = [...ladder];
  const [winner] = updated.splice(winnerIndex, 1);
  updated.splice(loserIndex, 0, winner);
  return updated;
};

export const applyLadderResultWithStats = (
  ladder: LadderPlayer[],
  winnerId: string,
  loserId: string
): LadderPlayer[] => {
  if (isInvalidMatchResult(winnerId, loserId)) {
    return ladder;
  }

  const matchIndices = resolveLadderMatchIndices(ladder, winnerId, loserId);
  if (!matchIndices) {
    return ladder;
  }

  const { winnerIndex, loserIndex } = matchIndices;
  const updated = [...ladder];
  const winner = updated[winnerIndex];
  const loser = updated[loserIndex];
  updated[winnerIndex] = { ...winner, wins: winner.wins + 1 };
  updated[loserIndex] = { ...loser, losses: loser.losses + 1 };

  if (winnerIndex < loserIndex) {
    return updated;
  }

  const [movedWinner] = updated.splice(winnerIndex, 1);
  updated.splice(loserIndex, 0, movedWinner);
  return updated;
};

/**
 * Update win/loss stats without changing ladder positions.
 */
export const updatePlayerStats = (
  ladder: LadderPlayer[],
  winnerId: string,
  loserId: string
): LadderPlayer[] => {
  if (isInvalidMatchResult(winnerId, loserId)) {
    return ladder;
  }

  return ladder.map((player) => {
    if (player.id === winnerId) {
      return { ...player, wins: player.wins + 1 };
    }
    if (player.id === loserId) {
      return { ...player, losses: player.losses + 1 };
    }
    return player;
  });
};

export const formatPlayerStats = (
  player: Pick<LadderPlayer, "wins" | "losses">
): string => `${player.wins}–${player.losses}`;

export const bookingToLadderMatch = (booking: Booking): LadderMatch | null => {
  if (!booking.playerAId || !booking.playerBId) {
    return null;
  }

  return {
    id: booking.id,
    playerAId: booking.playerAId,
    playerBId: booking.playerBId,
    bookingId: booking.id,
    bookingStart: booking.startDate,
    bookingEnd: booking.endDate,
    status: booking.ladderStatus ?? "planned",
    winnerId: booking.winnerId,
    comment: booking.comment,
  };
};
