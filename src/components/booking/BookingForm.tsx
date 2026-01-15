import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  useCheckAvailability,
  useCreateBookingMutation,
} from "@/hooks/useBookings";
import { cn } from "@/lib/utils";

import {
  InlineDateTimeWheelPicker,
  InlineTimeWheelPicker,
} from "./DateTimeWheelPicker";

const formatDateTime = (date: Date): string => {
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
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

export const BookingForm = () => {
  const { user } = useAuth();
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
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
    refetch: checkAvailability,
  } = useCheckAvailability(startDate, endDate);

  const createBookingMutation = useCreateBookingMutation();

  useEffect(() => {
    const checkAvailabilityAutomatically = async () => {
      if (endDate <= startDate) {
        setAvailabilityChecked(false);
        return;
      }

      try {
        await checkAvailability();
        setAvailabilityChecked(true);
      } catch {
        setAvailabilityChecked(false);
      }
    };

    checkAvailabilityAutomatically();
  }, [startDate, endDate, checkAvailability]);

  const handleStartDateChange = (newStartDate: Date) => {
    setStartDate(newStartDate);
    const newEnd = new Date(newStartDate);
    newEnd.setHours(newEnd.getHours() + 2);
    setEndDate(newEnd);
    setAvailabilityChecked(false);
  };

  const handleEndDateChange = (newEndDate: Date) => {
    // Ensure end date uses the same date as start date, only time changes
    const endWithStartDate = new Date(startDate);
    endWithStartDate.setHours(newEndDate.getHours());
    endWithStartDate.setMinutes(newEndDate.getMinutes());
    endWithStartDate.setSeconds(0);
    endWithStartDate.setMilliseconds(0);
    setEndDate(endWithStartDate);
    setAvailabilityChecked(false);
  };

  const handleCreateBooking = async () => {
    if (!user) {
      toast.error("You must be signed in to create a booking");
      return;
    }

    if (!availabilityChecked) {
      toast.error("Please check availability first");
      return;
    }

    if (!availabilityData?.isAvailable) {
      toast.error("Time slot is not available");
      return;
    }

    try {
      await createBookingMutation.mutateAsync({
        userId: user.uid,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      toast.success("Booking created successfully");
      setAvailabilityChecked(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create booking"
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 transition-all duration-300 ease-in-out">
        <div className="space-y-4">
          <div>
            <div
              className="flex cursor-pointer items-center justify-between border-b pb-3 transition-colors hover:text-primary"
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
              <span className="text-sm">Start</span>
              <span className="text-sm">{formatDateTime(startDate)}</span>
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
          </div>

          <div>
            <div
              className="flex cursor-pointer items-center justify-between border-b pb-3 transition-colors hover:text-primary"
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
              <span className="text-sm">End</span>
              <span className="text-sm">{formatDateTime(endDate)}</span>
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
          </div>

          {isCheckingAvailability && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-muted p-3 text-sm">
              <Spinner className="h-4 w-4" />
              <span>Checking availability...</span>
            </div>
          )}

          {availabilityChecked && !isCheckingAvailability && (
            <div
              className={cn(
                "rounded-md p-3 text-sm",
                availabilityData?.isAvailable
                  ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
                  : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
              )}
            >
              {availabilityData?.isAvailable
                ? "Time slot is available"
                : `Time slot not available (${availabilityData?.conflictingBookings.length} conflict${availabilityData?.conflictingBookings.length === 1 ? "" : "s"})`}
            </div>
          )}

          <Button
            onClick={handleCreateBooking}
            disabled={
              !availabilityChecked ||
              !availabilityData?.isAvailable ||
              createBookingMutation.isPending ||
              isCheckingAvailability
            }
            className={cn(
              "w-full",
              availabilityChecked &&
                !availabilityData?.isAvailable &&
                "cursor-not-allowed opacity-50"
            )}
          >
            {createBookingMutation.isPending ? (
              <>
                <Spinner className="h-4 w-4" />
                Creating...
              </>
            ) : (
              "Create Booking"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
