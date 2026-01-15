import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  useCheckAvailability,
  useCreateBookingMutation,
} from "@/hooks/useBookings";
import { cn } from "@/lib/utils";

import { DateTimeWheelPicker } from "./DateTimeWheelPicker";

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

  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
    refetch: checkAvailability,
  } = useCheckAvailability(startDate, endDate);

  const createBookingMutation = useCreateBookingMutation();

  const handleStartDateChange = (newStartDate: Date) => {
    setStartDate(newStartDate);
    const newEnd = new Date(newStartDate);
    newEnd.setHours(newEnd.getHours() + 2);
    setEndDate(newEnd);
    setAvailabilityChecked(false);
  };

  const handleEndDateChange = (newEndDate: Date) => {
    setEndDate(newEndDate);
    setAvailabilityChecked(false);
  };

  const handleCheckAvailability = async () => {
    if (endDate <= startDate) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const result = await checkAvailability();
      setAvailabilityChecked(true);

      if (result.data?.isAvailable) {
        toast.success("Time slot is available");
      } else {
        toast.error(
          `Time slot is not available (${result.data?.conflictingBookings.length || 0} conflict${(result.data?.conflictingBookings.length || 0) === 1 ? "" : "s"})`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to check availability"
      );
    }
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
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div
            className="flex cursor-pointer items-center justify-between border-b pb-3 transition-colors hover:text-primary"
            onClick={() => setStartPickerOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setStartPickerOpen(true);
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
            className="flex cursor-pointer items-center justify-between border-b pb-3 transition-colors hover:text-primary"
            onClick={() => setEndPickerOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setEndPickerOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Select end date and time"
          >
            <span className="text-sm">End</span>
            <span className="text-sm">{formatDateTime(endDate)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCheckAvailability}
              disabled={isCheckingAvailability || endDate <= startDate}
              className="flex-1"
            >
              {isCheckingAvailability ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Checking...
                </>
              ) : (
                "Check Availability"
              )}
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={
                !availabilityChecked ||
                !availabilityData?.isAvailable ||
                createBookingMutation.isPending
              }
              className={cn(
                "flex-1",
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

          {availabilityChecked && (
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
        </div>
      </div>

      <DateTimeWheelPicker
        open={startPickerOpen}
        onOpenChange={setStartPickerOpen}
        value={startDate}
        onChange={handleStartDateChange}
        title="Select Start Time"
      />

      <DateTimeWheelPicker
        open={endPickerOpen}
        onOpenChange={setEndPickerOpen}
        value={endDate}
        onChange={handleEndDateChange}
        title="Select End Time"
      />
    </div>
  );
};
