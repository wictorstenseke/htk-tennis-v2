/**
 * Common API types and interfaces
 */

// Base response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
}

// Error response
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Post entity (using JSONPlaceholder API schema)
export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// Create post input
export interface CreatePostInput {
  title: string;
  body: string;
  userId: number;
}

// Update post input
export interface UpdatePostInput {
  title?: string;
  body?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// User entity (from Firestore)
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  role?: "admin" | "superuser";
  createdAt?: string;
}

export type LadderStatus = "planned" | "completed";

// Booking entity (from Firestore)
export interface Booking {
  id: string;
  userId: string;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  createdAt: string; // ISO datetime
  playerAId?: string;
  playerBId?: string;
  ladderStatus?: LadderStatus;
  winnerId?: string;
  comment?: string;
}

export interface CreateBookingInput {
  userId: string;
  startDate: string; // ISO datetime string
  endDate: string; // ISO datetime string
  playerAId?: string;
  playerBId?: string;
  ladderStatus?: LadderStatus;
  winnerId?: string;
  comment?: string;
}

// App settings entity (from Firestore)
export interface AppSettings {
  bookingsEnabled: boolean;
}

// Announcement entity (from Firestore)
export interface Announcement {
  title: string;
  body: string;
  enabled: boolean;
  links?: Array<{ label: string; url: string }>;
}
