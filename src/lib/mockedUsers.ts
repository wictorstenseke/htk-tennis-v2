import type { User } from "@/types/api";

/**
 * Mocked users for testing and development
 * Shared between Stegen page and Admin page
 *
 * IMPORTANT: These mock users do NOT have corresponding Firestore documents.
 * This means:
 * - They appear in the ladder UI for testing
 * - Ladder stats updates for matches involving mock users are filtered out
 * - Stats are not persisted to Firestore for these users
 *
 * To enable full ladder stats functionality for these users, create
 * corresponding documents in the Firestore `users` collection with these UIDs.
 */
export const mockedUsers: User[] = [
  {
    uid: "mock-user-1",
    email: "elin.andersson@example.com",
    displayName: "Elin Andersson",
    ladderWins: 0,
    ladderLosses: 0,
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-2",
    email: "johan.larsson@example.com",
    displayName: "Johan Larsson",
    ladderWins: 0,
    ladderLosses: 0,
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-3",
    email: "sara.nilsson@example.com",
    displayName: "Sara Nilsson",
    ladderWins: 0,
    ladderLosses: 0,
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-4",
    email: "oskar.svensson@example.com",
    displayName: "Oskar Svensson",
    ladderWins: 0,
    ladderLosses: 0,
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-5",
    email: "lina.berg@example.com",
    displayName: "Lina Berg",
    ladderWins: 0,
    ladderLosses: 0,
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-6",
    email: "erik.persson@example.com",
    displayName: "Erik Persson",
    ladderWins: 0,
    ladderLosses: 0,
    createdAt: new Date().toISOString(),
  },
];
