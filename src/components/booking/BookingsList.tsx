import { useMemo } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useBookingsQuery } from "@/hooks/useBookings";
import { useUsersQuery } from "@/hooks/useUsers";

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
    return "Today";
  }

  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  // Format as weekday, day month
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
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

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    if (!bookings) return new Map<string, typeof bookings>();

    const grouped = new Map<string, typeof bookings>();
    bookings.forEach((booking) => {
      const dateKey = getDateKey(booking.startDate);
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, booking]);
    });

    // Sort bookings within each date by start time
    grouped.forEach((dateBookings) => {
      dateBookings.sort((a, b) => {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
    });

    return grouped;
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <h3 className="font-semibold">Error loading bookings</h3>
        <p className="text-sm">
          {bookingsError instanceof Error
            ? bookingsError.message
            : "An error occurred"}
        </p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="rounded-lg border border-muted bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">No bookings found</p>
      </div>
    );
  }

  // Sort date keys (most recent first)
  const sortedDateKeys = Array.from(groupedBookings.keys()).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="space-y-6">
      {sortedDateKeys.map((dateKey) => {
        const dateBookings = groupedBookings.get(dateKey) || [];
        const firstBooking = dateBookings[0];
        if (!firstBooking) return null;

        return (
          <div key={dateKey} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formatDateHeader(firstBooking.startDate)}
            </h3>
            <div className="space-y-1">
              {dateBookings.map((booking) => {
                const displayName = userMap.get(booking.userId) || "Unknown User";
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
