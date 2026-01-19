import { useMemo, useState } from "react";

import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { BookingForm } from "@/components/booking/BookingForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteLadderMatchMutation,
  useLadderMatchesQuery,
  useUpdateLadderMatchMutation,
} from "@/hooks/useLadderMatches";
import {
  useActiveLadderQuery,
  useJoinLadderMutation,
} from "@/hooks/useLadders";
import { useUpdateUserStatsMutation, useUsersQuery } from "@/hooks/useUsers";
import {
  applyLadderResultWithStats,
  buildLadderPlayers,
  formatPlayerStats,
  getChallengeStatus,
  type ChallengeReason,
  type LadderMatch,
  type LadderPlayer,
} from "@/lib/ladder";
import { mockedUsers } from "@/lib/mockedUsers";
import { cn } from "@/lib/utils";

interface ReportDraft {
  winnerId?: string;
  comment: string;
}

const emptyDraft: ReportDraft = { comment: "" };

const challengeReasonMessages: Record<ChallengeReason, string> = {
  self: "Du kan inte utmana dig själv.",
  "lower-ranked": "Du kan bara utmana spelare som ligger högre upp på stegen.",
  "too-far": "Du kan bara utmana spelare upp till fyra placeringar ovanför dig.",
  missing: "Spelaren kunde inte hittas i stegen.",
};

const formatMatchDate = (start: string, end?: string): string => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const dateLabel = startDate.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const startTime = startDate.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = endDate
    ? endDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    : null;

  return `${dateLabel} ${startTime}${endTime ? `–${endTime}` : ""}`;
};

/**
 * Prepare ladder stat updates for known users based on updated ladder state.
 */
const buildStatsUpdates = (
  ladder: LadderPlayer[],
  playerIds: string[],
  knownUserIds: Set<string>
) => {
  const playersById = new Map(
    ladder.map((player) => [player.id, player] as const)
  );
  return playerIds
    .map((id) => playersById.get(id))
    .filter(
      (player): player is LadderPlayer => !!player && knownUserIds.has(player.id)
    )
    .map((player) => ({
      uid: player.id,
      ladderWins: player.wins,
      ladderLosses: player.losses,
    }));
};

export const Stegen = () => {
  const { user } = useAuth();
  const { data: users, isLoading, error } = useUsersQuery();
  const {
    data: activeLadder,
    isLoading: ladderLoading,
    error: ladderError,
  } = useActiveLadderQuery();
  const {
    data: ladderMatches = [],
    isLoading: matchesLoading,
    error: matchesError,
  } = useLadderMatchesQuery(activeLadder?.id);
  const deleteLadderMatchMutation = useDeleteLadderMatchMutation();
  const updateLadderMatchMutation = useUpdateLadderMatchMutation();
  const updateUserStatsMutation = useUpdateUserStatsMutation();
  const joinLadderMutation = useJoinLadderMutation();
  const [ladderOverride, setLadderOverride] = useState<LadderPlayer[] | null>(
    null
  );
  const [selectedOpponent, setSelectedOpponent] = useState<LadderPlayer | null>(
    null
  );
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [reportDrafts, setReportDrafts] = useState<Record<string, ReportDraft>>(
    {}
  );
  const [cancelingMatchId, setCancelingMatchId] = useState<string | null>(null);

  const isUserParticipant =
    user && activeLadder
      ? activeLadder.participants.includes(user.uid)
      : false;

  const basePlayers = useMemo(() => {
    if (isLoading) {
      return [];
    }

    // Always include mocked users, and merge with real users
    const allUsers = [...mockedUsers];
    if (users && users.length > 0) {
      // Add real users that aren't already in mocked users
      const mockedUserIds = new Set(mockedUsers.map((u) => u.uid));
      const additionalUsers = users.filter((u) => !mockedUserIds.has(u.uid));
      allUsers.push(...additionalUsers);
    }
    return buildLadderPlayers(
      allUsers,
      user,
      activeLadder?.participants
    );
  }, [isLoading, users, user, activeLadder?.participants]);

  const ladder = useMemo(() => {
    if (basePlayers.length === 0) {
      return [];
    }

    if (!ladderOverride) {
      return basePlayers;
    }

    const existingIds = new Set(ladderOverride.map((player) => player.id));
    const missingPlayers = basePlayers.filter(
      (player) => !existingIds.has(player.id)
    );

    if (missingPlayers.length === 0) {
      return ladderOverride;
    }

    return [...ladderOverride, ...missingPlayers];
  }, [basePlayers, ladderOverride]);

  const usingMockPlayers = !isLoading && (!users || users.length === 0);
  const currentPlayerId = user?.uid ?? "";
  const knownUserIds = useMemo(
    () => new Set((users ?? []).map((currentUser) => currentUser.uid)),
    [users]
  );
  const currentPlayerPosition =
    currentPlayerId !== ""
      ? ladder.findIndex((player) => player.id === currentPlayerId)
      : -1;
  const matchCount = ladderMatches.length;
  const isContentLoading = isLoading || matchesLoading || ladderLoading;

  const handleJoinLadder = () => {
    if (!user || !activeLadder) {
      toast.error("Kunde inte gå med i stegen.");
      return;
    }

    joinLadderMutation.mutate(
      { ladderId: activeLadder.id, userId: user.uid },
      {
        onSuccess: () => {
          toast.success(`Du har gått med i ${activeLadder.name}!`);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Kunde inte gå med i stegen."
          );
        },
      }
    );
  };

  const handleSelectOpponent = (opponent: LadderPlayer) => {
    if (!user) {
      setChallengeMessage("Logga in för att kunna utmana en spelare.");
      setSelectedOpponent(null);
      return;
    }

    if (!isUserParticipant) {
      setChallengeMessage("Du måste gå med i stegen för att kunna utmana en spelare.");
      setSelectedOpponent(null);
      return;
    }

    const status = getChallengeStatus(ladder, user.uid, opponent.id);
    if (!status.eligible) {
      const reason =
        status.reason && challengeReasonMessages[status.reason]
          ? challengeReasonMessages[status.reason]
          : "Utmaningen kunde inte startas.";
      setChallengeMessage(reason);
      setSelectedOpponent(null);
      return;
    }

    setChallengeMessage(null);
    setSelectedOpponent(opponent);
  };

  const handleBookingSuccess = () => {
    if (!selectedOpponent || !user) {
      return;
    }
    setSelectedOpponent(null);
    setChallengeMessage(null);
  };

  const handleReportWinnerChange = (matchId: string, winnerId: string) => {
    setReportDrafts((current) => ({
      ...current,
      [matchId]: { ...current[matchId], winnerId },
    }));
  };

  const handleReportCommentChange = (matchId: string, comment: string) => {
    setReportDrafts((current) => ({
      ...current,
      [matchId]: { ...current[matchId], comment },
    }));
  };

  const handleReportResult = (match: LadderMatch) => {
    const draft = reportDrafts[match.id];
    if (!draft?.winnerId) {
      toast.error("Välj vinnare innan du rapporterar resultatet.");
      return;
    }

    const winnerId = draft.winnerId;

    const loserId =
      winnerId === match.playerAId ? match.playerBId : match.playerAId;
    const bookingId = match.bookingId ?? match.id;

    updateLadderMatchMutation.mutate(
      {
        bookingId,
        updates: {
          ladderStatus: "completed",
          winnerId,
          comment: draft.comment?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          const currentLadder = ladderOverride ?? basePlayers;
          const updatedLadder = applyLadderResultWithStats(
            currentLadder,
            winnerId,
            loserId
          );
          setLadderOverride(updatedLadder);
          setReportDrafts((current) => {
            const updated = { ...current };
            delete updated[match.id];
            return updated;
          });
          const statUpdates = buildStatsUpdates(
            updatedLadder,
            [winnerId, loserId],
            knownUserIds
          );
          if (statUpdates.length > 0) {
            updateUserStatsMutation.mutate(
              { updates: statUpdates },
              {
                onError: (error) => {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Kunde inte uppdatera statistik."
                  );
                },
              }
            );
          }
          toast.success("Resultatet är rapporterat och stegen är uppdaterad.");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Kunde inte rapportera resultatet."
          );
        },
      }
    );
  };

  const handleCancelMatch = (match: LadderMatch) => {
    if (cancelingMatchId) {
      return;
    }

    const clearMatch = () => {
      setCancelingMatchId(null);
    };

    setCancelingMatchId(match.id);

    const bookingId = match.bookingId ?? match.id;

    deleteLadderMatchMutation.mutate(bookingId, {
      onSuccess: () => {
        clearMatch();
        toast.success("Matchen är avbokad och bokningen är borttagen.");
      },
      onError: (error) => {
        setCancelingMatchId(null);
        toast.error(
          error instanceof Error
            ? error.message
            : "Kunde inte avboka matchen."
        );
      },
    });
  };

  if (isContentLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Laddar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">
            {activeLadder ? activeLadder.name : "Stegen"}
          </h1>
          {currentPlayerPosition >= 0 && isUserParticipant && (
            <Badge variant="secondary">
              Din placering: {currentPlayerPosition + 1}
            </Badge>
          )}
          {!isUserParticipant && user && (
            <Badge variant="outline">Du är inte med i stegen</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {isUserParticipant
            ? "Utmana spelare upp till fyra placeringar ovanför dig och boka match direkt."
            : "Gå med i stegen för att kunna utmana spelare och delta i turneringen."}
        </p>
      </div>

      {ladderError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Fel vid laddning av stegen</AlertTitle>
          <AlertDescription>
            {ladderError instanceof Error
              ? ladderError.message
              : "Ett fel uppstod vid hämtning av stegen."}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Fel vid laddning av användare</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Ett fel uppstod vid hämtning av spelare."}
          </AlertDescription>
        </Alert>
      )}

      {matchesError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Fel vid laddning av stegen-matcher</AlertTitle>
          <AlertDescription>
            {matchesError instanceof Error
              ? matchesError.message
              : "Ett fel uppstod vid hämtning av matcher."}
          </AlertDescription>
        </Alert>
      )}

      {!activeLadder && !ladderLoading && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Ingen aktiv stege</AlertTitle>
          <AlertDescription>
            Det finns för närvarande ingen aktiv stege. Kontakta en administratör för att skapa en ny stege.
          </AlertDescription>
        </Alert>
      )}

      {usingMockPlayers && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Testdata aktiv</AlertTitle>
          <AlertDescription>
            Stegen inkluderar exempelspelare för testning.
          </AlertDescription>
        </Alert>
      )}

      {activeLadder && user && !isUserParticipant && (
        <Card>
          <CardHeader>
            <CardTitle>Gå med i {activeLadder.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              För att kunna utmana spelare och delta i turneringen måste du gå med i stegen.
            </p>
            <Button
              onClick={handleJoinLadder}
              disabled={joinLadderMutation.isPending}
            >
              {joinLadderMutation.isPending ? "Går med..." : "Gå med i stegen"}
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Stegen</h2>
          <div className="flex gap-2">
            {activeLadder && (
              <Badge variant="outline">
                {activeLadder.participants.length} deltagare
              </Badge>
            )}
            <Badge variant="outline">{ladder.length} spelare</Badge>
          </div>
        </div>
        {ladder.length === 0 ? (
          <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center text-muted-foreground">
            Inga spelare hittades i stegen.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Placering</TableHead>
                  <TableHead>Spelare</TableHead>
                  <TableHead className="w-32">Statistik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ladder.map((player, index) => {
                  const isCurrentPlayer = player.id === currentPlayerId;
                  const status =
                    user && player.id !== currentPlayerId
                      ? getChallengeStatus(ladder, user.uid, player.id)
                      : null;

                  return (
                    <TableRow
                      key={player.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isCurrentPlayer
                          ? "bg-primary/10"
                          : "hover:bg-muted/50",
                        status && !status.eligible && !isCurrentPlayer
                          ? "text-muted-foreground"
                          : ""
                      )}
                      role="button"
                      tabIndex={0}
                      aria-disabled={!user}
                      onClick={() => handleSelectOpponent(player)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectOpponent(player);
                        }
                      }}
                    >
                      <TableCell className="font-semibold">{index + 1}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <span>{player.name}</span>
                        {isCurrentPlayer && (
                          <Badge variant="secondary">Du</Badge>
                        )}
                        {status?.eligible && (
                          <Badge variant="outline">Utmaningsbar</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatPlayerStats(player)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {challengeMessage && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Utmaning ej möjlig</AlertTitle>
            <AlertDescription>{challengeMessage}</AlertDescription>
          </Alert>
        )}

        {selectedOpponent && user && (
          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>Ny utmaning</CardTitle>
              <p className="text-sm text-muted-foreground">
                Du utmanar {selectedOpponent.name}. Boka matchen för att skapa en
                planerad stegen-match.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{user.displayName || user.email}</Badge>
                <span className="text-muted-foreground">vs</span>
                <Badge variant="outline">{selectedOpponent.name}</Badge>
              </div>
              <BookingForm
                triggerLabel={`Boka match mot ${selectedOpponent.name}`}
                onBookingCreated={handleBookingSuccess}
                bookingMetadata={{
                  playerAId: user.uid,
                  playerBId: selectedOpponent.id,
                  ladderStatus: "planned",
                  ladderId: activeLadder?.id,
                }}
                successMessage="Utmaning skapad och match bokad."
              />
              <Button
                variant="outline"
                onClick={() => setSelectedOpponent(null)}
              >
                Avbryt utmaning
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Stegen-matcher</h2>
          <Badge variant="outline">{matchCount} matcher</Badge>
        </div>
        {matchCount === 0 ? (
          <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center text-muted-foreground">
            Inga stegen-matcher ännu.
          </div>
        ) : (
          <div className="space-y-4">
            {ladderMatches.map((match) => {
              const playerA = ladder.find((player) => player.id === match.playerAId);
              const playerB = ladder.find((player) => player.id === match.playerBId);
              const draft = reportDrafts[match.id] ?? emptyDraft;
              const matchTitle = `${playerA?.name ?? "Spelare"} vs ${
                playerB?.name ?? "Spelare"
              }`;
              const matchDate =
                match.bookingStart && match.bookingEnd
                  ? formatMatchDate(match.bookingStart, match.bookingEnd)
                  : "Tid ej angiven";
              const isCompleted = match.status === "completed";

              const winner = match.winnerId === match.playerAId ? playerA : playerB;
              const loser = match.winnerId === match.playerAId ? playerB : playerA;
              const winnerName = winner?.name ?? "Spelare";
              const loserName = loser?.name ?? "Spelare";

              return (
                <Card key={match.id}>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{matchTitle}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {matchDate}
                      </div>
                    </div>
                    <Badge variant={isCompleted ? "outline" : "secondary"}>
                      {isCompleted ? "Avklarad" : "Planerad"}
                    </Badge>
                  </CardHeader>
                  {isCompleted ? (
                    <CardContent className="space-y-2">
                      {match.winnerId ? (
                        <p className="text-sm font-medium">
                          <strong className="font-bold">{winnerName}</strong> vinner matchen mot{" "}
                          <strong className="font-bold">{loserName}</strong>
                        </p>
                      ) : (
                        <p className="text-sm font-medium">Resultat saknas.</p>
                      )}
                      {match.comment && (
                        <p className="text-sm text-muted-foreground">
                          {match.comment}
                        </p>
                      )}
                    </CardContent>
                  ) : (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Välj vinnare</Label>
                        <RadioGroup
                          value={draft.winnerId ?? ""}
                          onValueChange={(value) =>
                            handleReportWinnerChange(match.id, value)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value={match.playerAId}
                              id={`${match.id}-player-a`}
                            />
                            <Label htmlFor={`${match.id}-player-a`}>
                              {playerA?.name ?? "Spelare A"}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value={match.playerBId}
                              id={`${match.id}-player-b`}
                            />
                            <Label htmlFor={`${match.id}-player-b`}>
                              {playerB?.name ?? "Spelare B"}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${match.id}-comment`}>
                          Kommentar (valfritt)
                        </Label>
                        <Textarea
                          id={`${match.id}-comment`}
                          value={draft.comment ?? ""}
                          onChange={(event) =>
                            handleReportCommentChange(match.id, event.target.value)
                          }
                          placeholder="Skriv en kort kommentar om matchen"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleReportResult(match)}>
                          Rapportera resultat
                        </Button>
                        <Button
                          variant="outline"
                          disabled={cancelingMatchId === match.id}
                          onClick={() => handleCancelMatch(match)}
                        >
                          {cancelingMatchId === match.id
                            ? "Avbokar..."
                            : "Avboka match"}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
