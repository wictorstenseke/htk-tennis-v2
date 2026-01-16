import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

import type {
  ApiError,
  Booking,
  CreateBookingInput,
  CreatePostInput,
  PaginationParams,
  Post,
  UpdatePostInput,
  User,
} from "@/types/api";

/**
 * Base API URL - using JSONPlaceholder for demo purposes
 */
const BASE_URL = "https://jsonplaceholder.typicode.com";

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Type-safe fetch wrapper with error handling
 */
const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status,
      }));

      throw new ApiException(
        errorData.message || "An error occurred",
        response.status,
        errorData.errors
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    // Network or other errors
    throw new ApiException(
      error instanceof Error ? error.message : "Network error occurred",
      0
    );
  }
};

/**
 * API Client - Posts endpoints
 */
export const postsApi = {
  /**
   * Get all posts with optional pagination
   */
  getPosts: async (params?: PaginationParams): Promise<Post[]> => {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("_page", params.page.toString());
    }
    if (params?.limit) {
      queryParams.append("_limit", params.limit.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/posts${query ? `?${query}` : ""}`;

    return fetchApi<Post[]>(endpoint);
  },

  /**
   * Get a single post by ID
   */
  getPost: async (id: number): Promise<Post> => {
    return fetchApi<Post>(`/posts/${id}`);
  },

  /**
   * Create a new post
   */
  createPost: async (data: CreatePostInput): Promise<Post> => {
    return fetchApi<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing post
   */
  updatePost: async (id: number, data: UpdatePostInput): Promise<Post> => {
    return fetchApi<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a post
   */
  deletePost: async (id: number): Promise<void> => {
    return fetchApi<void>(`/posts/${id}`, {
      method: "DELETE",
    });
  },
};

/**
 * API Client - Users endpoints
 */
export const usersApi = {
  /**
   * Get all users from Firestore
   */
  getUsers: async (): Promise<User[]> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        // Validate and construct User object with proper type checking
        return {
          uid: doc.id,
          email: typeof data.email === "string" ? data.email : "",
          displayName:
            typeof data.displayName === "string" ? data.displayName : undefined,
          createdAt:
            typeof data.createdAt === "string" ? data.createdAt : undefined,
        };
      });
    } catch (error) {
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to fetch users",
        0
      );
    }
  },
};

/**
 * Normalize booking data from Firestore to our standard Booking format
 * Handles both legacy formats (startTime/endTime) and new format (startDate/endDate)
 */
const normalizeBookingFromFirestore = (
  docId: string,
  data: Record<string, unknown>
): Booking | null => {
  // Try different possible field names (handle both old and new formats)
  // Standard: startDate/endDate (new bookings)
  // Legacy: startTime/endTime (old bookings)
  const startDateField = data.startDate || data.startAt || data.startTime;
  const endDateField = data.endDate || data.endAt || data.endTime;
  const createdAtField = data.createdAt || data.created_at;
  const ladderStatusField = data.ladderStatus;

  let startDateISO = "";
  let endDateISO = "";
  let createdAtISO = "";

  // Handle startDate
  if (startDateField instanceof Timestamp) {
    startDateISO = startDateField.toDate().toISOString();
  } else if (startDateField instanceof Date) {
    startDateISO = startDateField.toISOString();
  } else if (typeof startDateField === "string") {
    startDateISO = startDateField;
  }

  // Handle endDate
  if (endDateField instanceof Timestamp) {
    endDateISO = endDateField.toDate().toISOString();
  } else if (endDateField instanceof Date) {
    endDateISO = endDateField.toISOString();
  } else if (typeof endDateField === "string") {
    endDateISO = endDateField;
  }

  // Handle createdAt
  if (createdAtField instanceof Timestamp) {
    createdAtISO = createdAtField.toDate().toISOString();
  } else if (createdAtField instanceof Date) {
    createdAtISO = createdAtField.toISOString();
  } else if (typeof createdAtField === "string") {
    createdAtISO = createdAtField;
  }

  // Skip bookings with invalid dates
  if (!startDateISO || !endDateISO) {
    return null;
  }

  const userId =
    typeof data.userId === "string"
      ? data.userId
      : data.userId === null || data.userId === undefined
        ? ""
        : String(data.userId);

  const playerAId =
    typeof data.playerAId === "string" ? data.playerAId : undefined;
  const playerBId =
    typeof data.playerBId === "string" ? data.playerBId : undefined;
  const ladderStatus =
    ladderStatusField === "planned" || ladderStatusField === "completed"
      ? ladderStatusField
      : undefined;
  const winnerId = typeof data.winnerId === "string" ? data.winnerId : undefined;
  const comment = typeof data.comment === "string" ? data.comment : undefined;

  return {
    id: docId,
    userId,
    startDate: startDateISO,
    endDate: endDateISO,
    createdAt: createdAtISO || new Date().toISOString(),
    playerAId,
    playerBId,
    ladderStatus,
    winnerId,
    comment,
  };
};

/**
 * API Client - Bookings endpoints
 */
export const bookingsApi = {
  /**
   * Get all bookings from Firestore, sorted by startDate descending
   */
  getBookings: async (): Promise<Booking[]> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const bookingsCollection = collection(db, "bookings");
      let snapshot;

      try {
        // Try with orderBy on startDate first (for new bookings)
        const q = query(bookingsCollection, orderBy("startDate", "desc"));
        snapshot = await getDocs(q);
      } catch (indexError) {
        try {
          // Try with orderBy on startTime (for old bookings)
          const q = query(bookingsCollection, orderBy("startTime", "desc"));
          snapshot = await getDocs(q);
        } catch (indexError2) {
          // If neither index exists, fetch without orderBy and sort in memory
          console.warn(
            "Firestore index for startDate/startTime not found, fetching without orderBy. Errors:",
            indexError,
            indexError2
          );
          snapshot = await getDocs(bookingsCollection);
        }
      }

      const bookings = snapshot.docs
        .map((doc) => normalizeBookingFromFirestore(doc.id, doc.data()))
        .filter((booking): booking is Booking => booking !== null);

      // Sort by startDate descending (in case we fetched without orderBy)
      bookings.sort((a, b) => {
        const aTime = new Date(a.startDate).getTime();
        const bTime = new Date(b.startDate).getTime();
        return bTime - aTime;
      });

      return bookings;
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to fetch bookings",
        0
      );
    }
  },

  /**
   * Get ladder matches from bookings.
   */
  getLadderMatches: async (): Promise<Booking[]> => {
    const bookings = await bookingsApi.getBookings();
    return bookings.filter(
      (booking) => booking.playerAId && booking.playerBId
    );
  },

  /**
   * Get bookings for a specific date (YYYY-MM-DD format)
   */
  getBookingsByDate: async (dateKey: string): Promise<Booking[]> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const startOfDay = new Date(dateKey);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateKey);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsCollection = collection(db, "bookings");
      // Fetch all bookings and filter in memory since we need to check both startDate and startTime fields
      // Firestore doesn't support OR queries easily, so we'll fetch all and filter
      const snapshot = await getDocs(bookingsCollection);

      return snapshot.docs
        .map((doc) => {
          const data = doc.data();

          // Try different possible field names
          const startDateField =
            data.startDate || data.startAt || data.startTime;
          const endDateField = data.endDate || data.endAt || data.endTime;
          const createdAtField = data.createdAt || data.created_at;

          let startDateISO = "";
          let endDateISO = "";
          let createdAtISO = "";
          const ladderStatusField = data.ladderStatus;

          // Handle startDate
          if (startDateField instanceof Timestamp) {
            startDateISO = startDateField.toDate().toISOString();
          } else if (startDateField instanceof Date) {
            startDateISO = startDateField.toISOString();
          } else if (typeof startDateField === "string") {
            startDateISO = startDateField;
          }

          // Handle endDate
          if (endDateField instanceof Timestamp) {
            endDateISO = endDateField.toDate().toISOString();
          } else if (endDateField instanceof Date) {
            endDateISO = endDateField.toISOString();
          } else if (typeof endDateField === "string") {
            endDateISO = endDateField;
          }

          // Handle createdAt
          if (createdAtField instanceof Timestamp) {
            createdAtISO = createdAtField.toDate().toISOString();
          } else if (createdAtField instanceof Date) {
            createdAtISO = createdAtField.toISOString();
          } else if (typeof createdAtField === "string") {
            createdAtISO = createdAtField;
          }

          // Skip bookings with invalid dates
          if (!startDateISO || !endDateISO) {
            return null;
          }

          return {
            id: doc.id,
            userId: typeof data.userId === "string" ? data.userId : "",
            startDate: startDateISO,
            endDate: endDateISO,
            createdAt: createdAtISO,
            playerAId:
              typeof data.playerAId === "string" ? data.playerAId : undefined,
            playerBId:
              typeof data.playerBId === "string" ? data.playerBId : undefined,
            ladderStatus:
              ladderStatusField === "planned" || ladderStatusField === "completed"
                ? ladderStatusField
                : undefined,
            winnerId:
              typeof data.winnerId === "string" ? data.winnerId : undefined,
            comment: typeof data.comment === "string" ? data.comment : undefined,
          };
        })
        .filter((booking): booking is Booking => booking !== null);
    } catch (error) {
      throw new ApiException(
        error instanceof Error
          ? error.message
          : "Failed to fetch bookings by date",
        0
      );
    }
  },

  /**
   * Check if a time slot is available (no overlapping bookings)
   * Note: Firestore doesn't support multiple inequality filters on different fields,
   * so we fetch bookings that might overlap and filter in memory
   */
  checkAvailability: async (
    startDate: Date,
    endDate: Date
  ): Promise<{ isAvailable: boolean; conflictingBookings: Booking[] }> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const bookingsCollection = collection(db, "bookings");
      // Fetch all bookings and filter in memory since we need to check both startDate and startTime fields
      const snapshot = await getDocs(bookingsCollection);

      const requestedStart = startDate.getTime();
      const requestedEnd = endDate.getTime();

      const conflictingBookings = snapshot.docs
        .map((doc) => normalizeBookingFromFirestore(doc.id, doc.data()))
        .filter((booking): booking is Booking => {
          if (!booking) return false;

          // Check for overlap: booking starts before requested ends AND booking ends after requested starts
          const bookingStart = new Date(booking.startDate).getTime();
          const bookingEnd = new Date(booking.endDate).getTime();
          const hasOverlap =
            bookingStart < requestedEnd && bookingEnd > requestedStart;

          return hasOverlap;
        });

      return {
        isAvailable: conflictingBookings.length === 0,
        conflictingBookings,
      };
    } catch (error) {
      console.error("Error checking availability:", error);
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to check availability",
        0
      );
    }
  },

  /**
   * Create a new booking in Firestore
   */
  createBooking: async (data: CreateBookingInput): Promise<Booking> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const bookingsCollection = collection(db, "bookings");
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date provided");
      }

      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }

      const bookingData = {
        userId: data.userId,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        createdAt: Timestamp.now(),
        ...(typeof data.playerAId === "string" && data.playerAId !== ""
          ? { playerAId: data.playerAId }
          : {}),
        ...(typeof data.playerBId === "string" && data.playerBId !== ""
          ? { playerBId: data.playerBId }
          : {}),
        ...(data.ladderStatus ? { ladderStatus: data.ladderStatus } : {}),
        ...(typeof data.winnerId === "string" && data.winnerId !== ""
          ? { winnerId: data.winnerId }
          : {}),
        ...(typeof data.comment === "string" ? { comment: data.comment } : {}),
      };

      const docRef = await addDoc(bookingsCollection, bookingData);

      return {
        id: docRef.id,
        userId: data.userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
        playerAId: data.playerAId,
        playerBId: data.playerBId,
        ladderStatus: data.ladderStatus,
        winnerId: data.winnerId,
        comment: data.comment,
      };
    } catch (error) {
      console.error("Error creating booking:", error);
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to create booking",
        0
      );
    }
  },

  /**
   * Update ladder match metadata for an existing booking.
   */
  updateLadderMatch: async (
    bookingId: string,
    updates: Partial<
      Pick<
        Booking,
        "ladderStatus" | "winnerId" | "comment" | "playerAId" | "playerBId"
      >
    >
  ): Promise<
    Pick<Booking, "id"> &
      Partial<
        Pick<
          Booking,
          "ladderStatus" | "winnerId" | "comment" | "playerAId" | "playerBId"
        >
      >
  > => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const updateData: Record<string, unknown> = {};
      if (updates.ladderStatus) {
        updateData.ladderStatus = updates.ladderStatus;
      }
      if (typeof updates.winnerId === "string") {
        updateData.winnerId = updates.winnerId;
      }
      if (typeof updates.comment === "string") {
        updateData.comment = updates.comment;
      }
      if (typeof updates.playerAId === "string") {
        updateData.playerAId = updates.playerAId;
      }
      if (typeof updates.playerBId === "string") {
        updateData.playerBId = updates.playerBId;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ApiException("No ladder match updates provided", 0);
      }

      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, updateData);

      return { id: bookingId, ...updates };
    } catch (error) {
      console.error("Error updating ladder match:", error);
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to update ladder match",
        0
      );
    }
  },

  /**
   * Delete an existing booking
   */
  deleteBooking: async (bookingId: string): Promise<void> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", 0);
      }

      const bookingRef = doc(db, "bookings", bookingId);
      await deleteDoc(bookingRef);
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to delete booking",
        0
      );
    }
  },

  /**
   * Client-side availability check using existing bookings data
   * This avoids API calls by checking against bookings already in memory
   */
  checkAvailabilityFromBookings: (
    startDate: Date,
    endDate: Date,
    bookings: Booking[]
  ): { isAvailable: boolean; conflictingBookings: Booking[] } => {
    const requestedStart = startDate.getTime();
    const requestedEnd = endDate.getTime();

    const conflictingBookings = bookings.filter((booking) => {
      // Check for overlap: booking starts before requested ends AND booking ends after requested starts
      const bookingStart = new Date(booking.startDate).getTime();
      const bookingEnd = new Date(booking.endDate).getTime();
      return bookingStart < requestedEnd && bookingEnd > requestedStart;
    });

    return {
      isAvailable: conflictingBookings.length === 0,
      conflictingBookings,
    };
  },
};
