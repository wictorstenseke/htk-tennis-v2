import type { User } from "@/types/api";

/**
 * Mocked users for testing and development
 * Shared between Stegen page and Admin page
 */
export const mockedUsers: User[] = [
  {
    uid: "mock-user-1",
    email: "elin.andersson@example.com",
    displayName: "Elin Andersson",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-2",
    email: "johan.larsson@example.com",
    displayName: "Johan Larsson",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-3",
    email: "sara.nilsson@example.com",
    displayName: "Sara Nilsson",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-4",
    email: "oskar.svensson@example.com",
    displayName: "Oskar Svensson",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-5",
    email: "lina.berg@example.com",
    displayName: "Lina Berg",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "mock-user-6",
    email: "erik.persson@example.com",
    displayName: "Erik Persson",
    createdAt: new Date().toISOString(),
  },
];
