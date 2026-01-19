import { describe, expect, it } from "vitest";

import { bookingsApi } from "@/lib/api";
import { createConflictingBookings, createMockBooking } from "@/test/factories";

describe("bookingsApi", () => {
  describe("checkAvailabilityFromBookings", () => {
    const { existing, exactOverlap, partialOverlapStart, partialOverlapEnd, fullyWithin, adjacent } =
      createConflictingBookings();

    it("should return unavailable for exact overlap (same start/end times)", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date(exactOverlap.startDate),
        new Date(exactOverlap.endDate),
        [existing]
      );

      expect(result.isAvailable).toBe(false);
      expect(result.conflictingBookings).toHaveLength(1);
      expect(result.conflictingBookings[0].id).toBe(existing.id);
    });

    it("should return unavailable for partial overlap (starts before, ends during)", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date(partialOverlapStart.startDate),
        new Date(partialOverlapStart.endDate),
        [existing]
      );

      expect(result.isAvailable).toBe(false);
      expect(result.conflictingBookings).toHaveLength(1);
      expect(result.conflictingBookings[0].id).toBe(existing.id);
    });

    it("should return unavailable for partial overlap (starts during, ends after)", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date(partialOverlapEnd.startDate),
        new Date(partialOverlapEnd.endDate),
        [existing]
      );

      expect(result.isAvailable).toBe(false);
      expect(result.conflictingBookings).toHaveLength(1);
      expect(result.conflictingBookings[0].id).toBe(existing.id);
    });

    it("should return unavailable when new booking is fully within existing", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date(fullyWithin.startDate),
        new Date(fullyWithin.endDate),
        [existing]
      );

      expect(result.isAvailable).toBe(false);
      expect(result.conflictingBookings).toHaveLength(1);
      expect(result.conflictingBookings[0].id).toBe(existing.id);
    });

    it("should return available for adjacent bookings (no overlap)", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date(adjacent.startDate),
        new Date(adjacent.endDate),
        [existing]
      );

      expect(result.isAvailable).toBe(true);
      expect(result.conflictingBookings).toHaveLength(0);
    });

    it("should return all conflicting bookings when multiple conflicts exist", () => {
      const booking1 = createMockBooking({
        id: "booking-1",
        startDate: new Date("2024-01-15T10:00:00Z").toISOString(),
        endDate: new Date("2024-01-15T12:00:00Z").toISOString(),
      });
      const booking2 = createMockBooking({
        id: "booking-2",
        startDate: new Date("2024-01-15T11:00:00Z").toISOString(),
        endDate: new Date("2024-01-15T13:00:00Z").toISOString(),
      });

      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date("2024-01-15T10:30:00Z"),
        new Date("2024-01-15T12:30:00Z"),
        [booking1, booking2]
      );

      expect(result.isAvailable).toBe(false);
      expect(result.conflictingBookings).toHaveLength(2);
      expect(result.conflictingBookings.map((b) => b.id)).toEqual([
        "booking-1",
        "booking-2",
      ]);
    });

    it("should return available when no bookings exist", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date("2024-01-15T10:00:00Z"),
        new Date("2024-01-15T12:00:00Z"),
        []
      );

      expect(result.isAvailable).toBe(true);
      expect(result.conflictingBookings).toHaveLength(0);
    });

    it("should return available when booking is before all existing bookings", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date("2024-01-15T08:00:00Z"),
        new Date("2024-01-15T09:00:00Z"),
        [existing]
      );

      expect(result.isAvailable).toBe(true);
      expect(result.conflictingBookings).toHaveLength(0);
    });

    it("should return available when booking is after all existing bookings", () => {
      const result = bookingsApi.checkAvailabilityFromBookings(
        new Date("2024-01-15T14:00:00Z"),
        new Date("2024-01-15T16:00:00Z"),
        [existing]
      );

      expect(result.isAvailable).toBe(true);
      expect(result.conflictingBookings).toHaveLength(0);
    });
  });
});
