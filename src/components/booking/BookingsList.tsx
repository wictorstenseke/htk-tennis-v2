import { useMemo } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useBookingsQuery } from "@/hooks/useBookings";
import { useUsersQuery } from "@/hooks/useUsers";

import type { Booking } from "@/types/api";

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDateHeader = (isoString: string): string => {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return "Idag";
  }

  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Imorgon";
  }

  // Format as weekday, day month
  const dayNames = [
    "Söndag",
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
  ];
  const monthNames = [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December",
  ];

  return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
};

const getDateKey = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

export const BookingsList = () => {
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } =
    useBookingsQuery();
  const { data: users, isLoading: usersLoading } = useUsersQuery();

  const isLoading = bookingsLoading || usersLoading;

  // Create a map of userId to displayName
  const userMap = useMemo(() => {
    if (!users) return new Map<string, string>();
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.uid, user.displayName || user.email);
    });
    return map;
  }, [users]);

  // Split bookings into upcoming and history, then group by date
  const { upcomingGrouped, historyGrouped } = useMemo(() => {
    if (!bookings) {
      return {
        upcomingGrouped: new Map<string, Booking[]>(),
        historyGrouped: new Map<string, Booking[]>(),
      };
    }

    const now = new Date();
    const upcoming: typeof bookings = [];
    const history: typeof bookings = [];

    // Split bookings based on end date
    bookings.forEach((booking) => {
      const endDate = new Date(booking.endDate);
      if (endDate >= now) {
        upcoming.push(booking);
      } else {
        history.push(booking);
      }
    });

    // Sort upcoming by start date ascending (soonest first)
    upcoming.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Sort history by start date descending (most recent first)
    history.sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    // Group upcoming bookings by date
    const upcomingGrouped = new Map<string, Booking[]>();
    upcoming.forEach((booking) => {
      const dateKey = getDateKey(booking.startDate);
      const existing = upcomingGrouped.get(dateKey) || [];
      upcomingGrouped.set(dateKey, [...existing, booking]);
    });

    // Group history bookings by date
    const historyGrouped = new Map<string, Booking[]>();
    history.forEach((booking) => {
      const dateKey = getDateKey(booking.startDate);
      const existing = historyGrouped.get(dateKey) || [];
      historyGrouped.set(dateKey, [...existing, booking]);
    });

    // Sort bookings within each date by start time
    upcomingGrouped.forEach((dateBookings) => {
      dateBookings.sort((a, b) => {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
    });

    historyGrouped.forEach((dateBookings) => {
      dateBookings.sort((a, b) => {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
    });

    return { upcomingGrouped, historyGrouped };
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Laddar...</span>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <h3 className="font-semibold">Fel vid laddning av bokningar</h3>
        <p className="text-sm">
          {bookingsError instanceof Error
            ? bookingsError.message
            : "Ett fel uppstod"}
        </p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">Inga bokningar hittades</p>
      </div>
    );
  }

  // Sort date keys for upcoming (ascending - soonest first)
  const upcomingDateKeys = Array.from(upcomingGrouped.keys()).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Sort date keys for history (descending - most recent first)
  const historyDateKeys = Array.from(historyGrouped.keys()).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const renderBookingSection = (
    dateKeys: string[],
    groupedData: Map<string, Booking[]>
  ) => {
    if (dateKeys.length === 0) {
      return (
        <div className="rounded-lg border border-muted bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">Inga bokningar</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dateKeys.map((dateKey) => {
          const dateBookings = groupedData.get(dateKey) || [];
          const firstBooking = dateBookings[0];
          if (!firstBooking) return null;

          return (
            <div key={dateKey} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDateHeader(firstBooking.startDate)}
              </h4>
              <div className="space-y-1">
                {dateBookings.map((booking) => {
                  const displayName =
                    userMap.get(booking.userId) || "Okänd användare";
                  return (
                    <div
                      key={booking.id}
                      className="rounded-md bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{displayName}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(booking.startDate)} -{" "}
                          {formatTime(booking.endDate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Upcoming Events Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Kommande bokningar</h3>
          <p className="text-sm text-muted-foreground">
            Bokningar som pågår eller kommer att ske
          </p>
        </div>
        {renderBookingSection(upcomingDateKeys, upcomingGrouped)}
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Historik</h3>
          <p className="text-sm text-muted-foreground">
            Tidigare genomförda bokningar
          </p>
        </div>
        {renderBookingSection(historyDateKeys, historyGrouped)}
      </div>
    </div>
  );
};
