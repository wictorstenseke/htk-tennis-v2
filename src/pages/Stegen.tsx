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
import { useDeleteBookingMutation } from "@/hooks/useBookings";
import { useUsersQuery } from "@/hooks/useUsers";
import {
  applyLadderResult,
  buildLadderPlayers,
  getChallengeStatus,
  type ChallengeReason,
  type LadderMatch,
  type LadderPlayer,
} from "@/lib/ladder";
import { cn } from "@/lib/utils";

import type { Booking } from "@/types/api";

interface ReportDraft {
  winnerId?: string;
  comment: string;
}

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

export const Stegen = () => {
  const { user } = useAuth();
  const { data: users, isLoading, error } = useUsersQuery();
  const deleteBookingMutation = useDeleteBookingMutation();
  const [ladderOverride, setLadderOverride] = useState<LadderPlayer[] | null>(
    null
  );
  const [matches, setMatches] = useState<LadderMatch[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<LadderPlayer | null>(
    null
  );
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [reportDrafts, setReportDrafts] = useState<Record<string, ReportDraft>>(
    {}
  );
  const [cancelingMatchId, setCancelingMatchId] = useState<string | null>(null);

  const basePlayers = useMemo(() => {
    if (isLoading) {
      return [];
    }

    return buildLadderPlayers(users, user);
  }, [isLoading, users, user]);

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
  const currentPlayerPosition =
    currentPlayerId !== ""
      ? ladder.findIndex((player) => player.id === currentPlayerId)
      : -1;
  const plannedMatches = matches.filter((match) => match.status === "planned");

  const handleSelectOpponent = (opponent: LadderPlayer) => {
    if (!user) {
      setChallengeMessage("Logga in för att kunna utmana en spelare.");
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

  const handleBookingCreated = (booking: Booking) => {
    if (!selectedOpponent || !user) {
      return;
    }

    const newMatch: LadderMatch = {
      id: `match-${crypto.randomUUID()}`,
      playerAId: user.uid,
      playerBId: selectedOpponent.id,
      bookingId: booking.id,
      bookingStart: booking.startDate,
      bookingEnd: booking.endDate,
      status: "planned",
    };

    setMatches((current) => [newMatch, ...current]);
    setSelectedOpponent(null);
    setChallengeMessage(null);
    toast.success("Utmaning skapad och match bokad.");
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

    setLadderOverride((current) =>
      applyLadderResult(current ?? basePlayers, winnerId, loserId)
    );
    setMatches((current) =>
      current.map((item) =>
        item.id === match.id
          ? {
              ...item,
              status: "completed",
              winnerId,
              comment: draft.comment?.trim() || undefined,
            }
          : item
      )
    );
    setReportDrafts((current) => {
      const updated = { ...current };
      delete updated[match.id];
      return updated;
    });
    toast.success("Resultatet är rapporterat och stegen är uppdaterad.");
  };

  const handleCancelMatch = (match: LadderMatch) => {
    if (cancelingMatchId) {
      return;
    }

    const clearMatch = () => {
      setMatches((current) => current.filter((item) => item.id !== match.id));
      setCancelingMatchId(null);
    };

    setCancelingMatchId(match.id);

    if (!match.bookingId) {
      clearMatch();
      toast.success("Matchen är avbokad.");
      return;
    }

    deleteBookingMutation.mutate(match.bookingId, {
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

  if (isLoading) {
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
          <h1 className="text-3xl font-bold">Stegen</h1>
          {currentPlayerPosition >= 0 && (
            <Badge variant="secondary">
              Din placering: {currentPlayerPosition + 1}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Utmana spelare upp till fyra placeringar ovanför dig och boka match direkt.
        </p>
      </div>

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

      {usingMockPlayers && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Testdata aktiv</AlertTitle>
          <AlertDescription>
            Inga användare hittades ännu, så stegen visar exempelspelare.
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Stegen</h2>
          <Badge variant="outline">{ladder.length} spelare</Badge>
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
                onBookingCreated={handleBookingCreated}
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
          <h2 className="text-2xl font-bold">Planerade stegen-matcher</h2>
          <Badge variant="outline">{plannedMatches.length} matcher</Badge>
        </div>
        {plannedMatches.length === 0 ? (
          <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center text-muted-foreground">
            Inga planerade matcher ännu.
          </div>
        ) : (
          <div className="space-y-4">
            {plannedMatches.map((match) => {
              const playerA = ladder.find((player) => player.id === match.playerAId);
              const playerB = ladder.find((player) => player.id === match.playerBId);
              const draft = reportDrafts[match.id] ?? { comment: "" };
              const matchTitle = `${playerA?.name ?? "Spelare"} vs ${
                playerB?.name ?? "Spelare"
              }`;
              const matchDate =
                match.bookingStart && match.bookingEnd
                  ? formatMatchDate(match.bookingStart, match.bookingEnd)
                  : "Tid ej angiven";

              return (
                <Card key={match.id}>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{matchTitle}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {matchDate}
                        {match.court ? ` • ${match.court}` : " • Bana ej angiven"}
                      </div>
                    </div>
                    <Badge variant="secondary">Planerad</Badge>
                  </CardHeader>
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
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
