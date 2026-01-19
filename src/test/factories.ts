import { Timestamp } from "firebase/firestore";

import type { User } from "firebase/auth";

import type { Booking, Ladder, LadderStatus } from "@/types/api";

/**
 * Create a mock Firebase Auth User
 */
export const createMockAuthUser = (
  overrides?: Partial<User>
): Partial<User> => ({
  uid: "test-uid-123",
  email: "test@example.com",
  displayName: "Test User",
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: "mock-refresh-token",
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => "mock-id-token",
  getIdTokenResult: async () => ({
    token: "mock-id-token",
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    signInProvider: "password",
    signInSecondFactor: null,
    claims: {},
  }),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  photoURL: null,
  providerId: "firebase",
  ...overrides,
});

/**
 * Create a mock Firestore user profile
 */
export const createMockUser = (
  overrides?: Partial<import("@/types/api").User>
): import("@/types/api").User => ({
  uid: "test-uid-123",
  email: "test@example.com",
  displayName: "Test User",
  phone: undefined,
  ladderWins: 0,
  ladderLosses: 0,
  role: "user",
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock booking
 */
export const createMockBooking = (overrides?: Partial<Booking>): Booking => {
  const now = new Date();
  const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours

  return {
    id: "booking-123",
    userId: "user-123",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    createdAt: now.toISOString(),
    playerAId: undefined,
    playerBId: undefined,
    ladderStatus: undefined,
    winnerId: undefined,
    comment: undefined,
    ...overrides,
  };
};

/**
 * Create a mock ladder
 */
export const createMockLadder = (overrides?: Partial<Ladder>): Ladder => ({
  id: "ladder-123",
  name: "Test Ladder",
  description: "A test ladder",
  participants: [],
  status: "active",
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock Firestore document snapshot
 */
export const createMockDocumentSnapshot = <T>(data: T) => ({
  id: "doc-123",
  exists: () => true,
  data: () => data,
  get: (field: string) => (data as Record<string, unknown>)[field],
});

/**
 * Create a mock Firestore Timestamp
 */
export const createMockTimestamp = (date: Date = new Date()) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: (other: Timestamp) => date.getTime() === other.toMillis(),
  valueOf: () => date.getTime().toString(),
});

/**
 * Create multiple mock bookings with time conflicts
 */
export const createConflictingBookings = (): {
  existing: Booking;
  exactOverlap: Booking;
  partialOverlapStart: Booking;
  partialOverlapEnd: Booking;
  fullyWithin: Booking;
  adjacent: Booking;
} => {
  const baseStart = new Date("2024-01-15T10:00:00Z");
  const baseEnd = new Date("2024-01-15T12:00:00Z");

  const existing = createMockBooking({
    id: "existing-1",
    startDate: baseStart.toISOString(),
    endDate: baseEnd.toISOString(),
  });

  const exactOverlap = createMockBooking({
    id: "exact-overlap",
    startDate: baseStart.toISOString(),
    endDate: baseEnd.toISOString(),
  });

  const partialOverlapStart = createMockBooking({
    id: "partial-start",
    startDate: new Date("2024-01-15T09:00:00Z").toISOString(),
    endDate: new Date("2024-01-15T11:00:00Z").toISOString(),
  });

  const partialOverlapEnd = createMockBooking({
    id: "partial-end",
    startDate: new Date("2024-01-15T11:00:00Z").toISOString(),
    endDate: new Date("2024-01-15T13:00:00Z").toISOString(),
  });

  const fullyWithin = createMockBooking({
    id: "fully-within",
    startDate: new Date("2024-01-15T10:30:00Z").toISOString(),
    endDate: new Date("2024-01-15T11:30:00Z").toISOString(),
  });

  const adjacent = createMockBooking({
    id: "adjacent",
    startDate: baseEnd.toISOString(), // Starts exactly when existing ends
    endDate: new Date("2024-01-15T14:00:00Z").toISOString(),
  });

  return {
    existing,
    exactOverlap,
    partialOverlapStart,
    partialOverlapEnd,
    fullyWithin,
    adjacent,
  };
};

/**
 * Create a mock ladder match booking
 */
export const createMockLadderMatch = (
  overrides?: Partial<Booking>
): Booking => {
  return createMockBooking({
    playerAId: "player-a",
    playerBId: "player-b",
    ladderStatus: "planned" as LadderStatus,
    ladderId: "ladder-123",
    ...overrides,
  });
};
