import { useMemo, useState } from "react";

import { AlertCircle, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/useAuth";
import {
  useCheckAvailability,
  useCreateBookingMutation,
} from "@/hooks/useBookings";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useUsersQuery } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";

import {
  InlineDateTimeWheelPicker,
  InlineTimeWheelPicker,
} from "./DateTimeWheelPicker";

import type { Booking, CreateBookingInput } from "@/types/api";

const formatDateTime = (date: Date): string => {
  const dayNames = ["sön", "mån", "tis", "ons", "tors", "fre", "lör"];
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "maj",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "dec",
  ];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${dayName} ${day} ${monthName} ${hours}.${minutes}`;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}.${minutes}`;
};

interface BookingFormProps {
  triggerLabel?: string;
  onBookingCreated?: (booking: Booking) => void;
  bookingMetadata?: Pick<
    CreateBookingInput,
    "playerAId" | "playerBId" | "ladderStatus" | "winnerId" | "comment"
  >;
  successMessage?: string;
}

export const BookingForm = ({
  triggerLabel = "Boka match",
  onBookingCreated,
  bookingMetadata,
  successMessage = "Match bokad",
}: BookingFormProps) => {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { data: users } = useUsersQuery();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    const end = new Date(now);
    end.setHours(end.getHours() + 2);
    return end;
  });

  const [visiblePicker, setVisiblePicker] = useState<"start" | "end" | null>(
    null
  );

  const { data: availabilityData, isLoading: isCheckingAvailability } =
    useCheckAvailability(startDate, endDate);

  const createBookingMutation = useCreateBookingMutation();

  // Create a map of userId to displayName
  const userMap = useMemo(() => {
    if (!users) return new Map<string, string>();
    const map = new Map<string, string>();
    users.forEach((user) => {
      map.set(user.uid, user.displayName || user.email);
    });
    return map;
  }, [users]);

  // Check if availability has been computed and dates are valid
  const availabilityChecked = availabilityData !== null && endDate > startDate;

  const handleStartDateChange = (newStartDate: Date) => {
    setStartDate(newStartDate);
    const newEnd = new Date(newStartDate);
    newEnd.setHours(newEnd.getHours() + 2);
    setEndDate(newEnd);
  };

  const handleEndDateChange = (newEndDate: Date) => {
    // Ensure end date uses the same date as start date, only time changes
    const endWithStartDate = new Date(startDate);
    endWithStartDate.setHours(newEndDate.getHours());
    endWithStartDate.setMinutes(newEndDate.getMinutes());
    endWithStartDate.setSeconds(0);
    endWithStartDate.setMilliseconds(0);
    setEndDate(endWithStartDate);
  };

  const handleCreateBooking = () => {
    if (!user) {
      toast.error("Du måste vara inloggad för att boka match");
      return;
    }

    if (!availabilityChecked) {
      toast.error("Kontrollera tillgänglighet först");
      return;
    }

    if (!availabilityData?.isAvailable) {
      toast.error("Tid redan bokad");
      return;
    }

    // Close dialog immediately for instant feedback (optimistic update will show booking in list)
    setOpen(false);

    // Use mutate instead of mutateAsync for immediate optimistic update
    createBookingMutation.mutate(
      {
        userId: user.uid,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...bookingMetadata,
      },
      {
        onSuccess: (booking) => {
          // Show success toast only after server confirms
          toast.success(successMessage);
          onBookingCreated?.(booking);
        },
        onError: (error) => {
          // Show error toast if mutation fails (optimistic update will be rolled back)
          toast.error(
            error instanceof Error ? error.message : "Kunde inte boka match"
          );
        },
      }
    );
  };

  const bookingContent = (
    <div className={cn("space-y-4 pb-8", isMobile && "px-4")}>
      <div>
        <div
          className="flex cursor-pointer items-center justify-between pb-3 transition-colors group"
          onClick={() =>
            setVisiblePicker(visiblePicker === "start" ? null : "start")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setVisiblePicker(visiblePicker === "start" ? null : "start");
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Select start date and time"
        >
          <span className="text-sm">Starttid</span>
          <span className="text-sm text-primary underline-offset-4 group-hover:text-primary group-hover:underline">
            {formatDateTime(startDate)}
          </span>
        </div>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            visiblePicker === "start"
              ? "max-h-[400px] opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          {visiblePicker === "start" && (
            <InlineDateTimeWheelPicker
              value={startDate}
              onChange={handleStartDateChange}
            />
          )}
        </div>
        <div className="border-b"></div>
      </div>

      <div>
        <div
          className="flex cursor-pointer items-center justify-between pb-3 transition-colors group"
          onClick={() =>
            setVisiblePicker(visiblePicker === "end" ? null : "end")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setVisiblePicker(visiblePicker === "end" ? null : "end");
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Select end date and time"
        >
          <span className="text-sm">Sluttid</span>
          <span className="text-sm text-primary underline-offset-4 group-hover:text-primary group-hover:underline">
            {formatDateTime(endDate)}
          </span>
        </div>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            visiblePicker === "end"
              ? "max-h-[400px] opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          {visiblePicker === "end" && (
            <InlineTimeWheelPicker
              value={endDate}
              onChange={handleEndDateChange}
              baseDate={startDate}
            />
          )}
        </div>
        <div className="border-b"></div>
      </div>

      {availabilityChecked &&
        !isCheckingAvailability &&
        !availabilityData?.isAvailable &&
        availabilityData?.conflictingBookings &&
        availabilityData.conflictingBookings.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Krockar med
            </div>
            <div className="flex flex-wrap gap-2">
              {availabilityData.conflictingBookings.map((booking) => {
                const userName =
                  userMap.get(booking.userId) || "Okänd användare";
                const startTime = formatTime(new Date(booking.startDate));
                const endTime = formatTime(new Date(booking.endDate));
                return (
                  <Badge key={booking.id} variant="outline">
                    <AlertCircle className="h-3 w-3" />
                    {userName} {startTime}-{endTime}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

      <Button
        onClick={handleCreateBooking}
        disabled={
          !availabilityChecked ||
          !availabilityData?.isAvailable ||
          isCheckingAvailability
        }
        className="w-full"
      >
        Boka match
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button size="lg">{triggerLabel}</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 z-50 cursor-pointer rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DrawerClose>
          <DrawerHeader>
            <DrawerTitle>Boka match</DrawerTitle>
          </DrawerHeader>
          {bookingContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Boka match</DialogTitle>
        </DialogHeader>
        {bookingContent}
      </DialogContent>
    </Dialog>
  );
};
