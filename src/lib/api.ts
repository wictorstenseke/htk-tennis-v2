import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

import type {
  Announcement,
  ApiError,
  AppSettings,
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
 * Error status code for client-side errors (not HTTP errors)
 */
const CLIENT_ERROR_STATUS = 0;

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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: typeof data.email === "string" ? data.email : "",
          displayName:
            typeof data.displayName === "string" ? data.displayName : undefined,
          phone: typeof data.phone === "string" ? data.phone : undefined,
          ladderWins:
            typeof data.ladderWins === "number" ? data.ladderWins : undefined,
          ladderLosses:
            typeof data.ladderLosses === "number" ? data.ladderLosses : undefined,
          role:
            data.role === "admin" || data.role === "superuser"
              ? data.role
              : undefined,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : typeof data.createdAt === "string"
                ? data.createdAt
                : undefined,
        };
      });
    } catch (error) {
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to fetch users",
        0
      );
    }
  },

  /**
   * Get a single user by UID
   */
  getUser: async (uid: string): Promise<User> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const userDoc = doc(db, "users", uid);
      const snapshot = await getDoc(userDoc);

      if (!snapshot.exists()) {
        throw new ApiException("Användare hittades inte", 404);
      }

      const data = snapshot.data();
      return {
        uid: snapshot.id,
        email: typeof data.email === "string" ? data.email : "",
        displayName:
          typeof data.displayName === "string" ? data.displayName : undefined,
        phone: typeof data.phone === "string" ? data.phone : undefined,
        ladderWins:
          typeof data.ladderWins === "number" ? data.ladderWins : undefined,
        ladderLosses:
          typeof data.ladderLosses === "number" ? data.ladderLosses : undefined,
        role:
          data.role === "admin" || data.role === "superuser"
            ? data.role
            : undefined,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : typeof data.createdAt === "string"
              ? data.createdAt
              : undefined,
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to fetch user",
        0
      );
    }
  },

  /**
   * Create a user profile document
   */
  createUser: async ({
    uid,
    email,
    displayName,
  }: {
    uid: string;
    email: string;
    displayName?: string;
  }): Promise<User> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const userDoc = doc(db, "users", uid);
      const createdAt = Timestamp.now();
      const userData = {
        uid,
        email,
        displayName,
        createdAt,
      };

      await setDoc(userDoc, userData);

      return {
        uid,
        email,
        displayName,
        createdAt: createdAt.toDate().toISOString(),
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to create user",
        CLIENT_ERROR_STATUS
      );
    }
  },

  /**
   * Update user data
   */
  updateUser: async (uid: string, updates: Partial<User>): Promise<User> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const userDoc = doc(db, "users", uid);
      const updateData: Record<string, unknown> = {};

      if (typeof updates.displayName === "string") {
        updateData.displayName = updates.displayName;
      }
      // Use Object.hasOwn to distinguish between setting phone to empty string (update with deleteField) vs not including it in updates
      if (Object.hasOwn(updates, "phone")) {
        updateData.phone =
          typeof updates.phone === "string" ? updates.phone : deleteField();
      }
      if (Object.hasOwn(updates, "ladderWins")) {
        updateData.ladderWins =
          typeof updates.ladderWins === "number"
            ? updates.ladderWins
            : deleteField();
      }
      if (Object.hasOwn(updates, "ladderLosses")) {
        updateData.ladderLosses =
          typeof updates.ladderLosses === "number"
            ? updates.ladderLosses
            : deleteField();
      }
      if (updates.role === "admin" || updates.role === "superuser") {
        updateData.role = updates.role;
      } else if (Object.hasOwn(updates, "role") && !updates.role) {
        updateData.role = deleteField();
      }

      if (Object.keys(updateData).length === 0) {
        throw new ApiException("Inga uppdateringar tillhandahölls", CLIENT_ERROR_STATUS);
      }

      await updateDoc(userDoc, updateData);

      return usersApi.getUser(uid);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to update user",
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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const startOfDay = new Date(dateKey);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateKey);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsCollection = collection(db, "bookings");
      // Fetch all bookings and filter in memory since we need to check both startDate and startTime fields
      // Firestore doesn't support OR queries easily, so we'll fetch all and filter
      const snapshot = await getDocs(bookingsCollection);

      const mappedBookings = snapshot.docs
        .map((doc): Booking | null => {
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

      return mappedBookings;
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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const updateData: Record<string, unknown> = {};
      if (updates.ladderStatus) {
        updateData.ladderStatus = updates.ladderStatus;
      }
      if (Object.hasOwn(updates, "winnerId")) {
        updateData.winnerId =
          typeof updates.winnerId === "string"
            ? updates.winnerId
            : deleteField();
      }
      if (Object.hasOwn(updates, "comment")) {
        updateData.comment =
          typeof updates.comment === "string" ? updates.comment : deleteField();
      }
      if (typeof updates.playerAId === "string") {
        updateData.playerAId = updates.playerAId;
      }
      if (typeof updates.playerBId === "string") {
        updateData.playerBId = updates.playerBId;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ApiException(
          "Inga stegmatchuppdateringar tillhandahölls",
          0
        );
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
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
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

/**
 * API Client - App Settings endpoints
 */
export const appSettingsApi = {
  /**
   * Get app settings from Firestore
   */
  getAppSettings: async (): Promise<AppSettings> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const settingsDoc = doc(db, "appSettings", "default");
      const snapshot = await getDoc(settingsDoc);

      if (!snapshot.exists()) {
        return { bookingsEnabled: true };
      }

      const data = snapshot.data();
      return {
        bookingsEnabled:
          typeof data.bookingsEnabled === "boolean"
            ? data.bookingsEnabled
            : true,
      };
    } catch (error) {
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to fetch app settings",
        0
      );
    }
  },

  /**
   * Update app settings
   */
  updateAppSettings: async (
    updates: Partial<AppSettings>
  ): Promise<AppSettings> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const settingsDoc = doc(db, "appSettings", "default");
      const updateData: Record<string, unknown> = {};

      if (typeof updates.bookingsEnabled === "boolean") {
        updateData.bookingsEnabled = updates.bookingsEnabled;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ApiException("Inga uppdateringar tillhandahölls", CLIENT_ERROR_STATUS);
      }

      await updateDoc(settingsDoc, updateData);

      return appSettingsApi.getAppSettings();
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        error instanceof Error
          ? error.message
          : "Failed to update app settings",
        0
      );
    }
  },
};

/**
 * API Client - Announcements endpoints
 */
export const announcementsApi = {
  /**
   * Get announcement from Firestore
   */
  getAnnouncement: async (): Promise<Announcement> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const announcementDoc = doc(db, "announcements", "main");
      const snapshot = await getDoc(announcementDoc);

      if (!snapshot.exists()) {
        return { title: "", body: "", enabled: false };
      }

      const data = snapshot.data();
      return {
        title: typeof data.title === "string" ? data.title : "",
        body: typeof data.body === "string" ? data.body : "",
        enabled:
          typeof data.enabled === "boolean" ? data.enabled : false,
        links: Array.isArray(data.links)
          ? data.links.filter(
              (link): link is { label: string; url: string } =>
                typeof link === "object" &&
                link !== null &&
                typeof link.label === "string" &&
                typeof link.url === "string"
            )
          : undefined,
      };
    } catch (error) {
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to fetch announcement",
        0
      );
    }
  },

  /**
   * Update announcement
   */
  updateAnnouncement: async (
    updates: Partial<Announcement>
  ): Promise<Announcement> => {
    try {
      if (!db) {
        throw new ApiException("Firebase är inte konfigurerat", CLIENT_ERROR_STATUS);
      }

      const announcementDoc = doc(db, "announcements", "main");
      const updateData: Record<string, unknown> = {};

      if (typeof updates.title === "string") {
        updateData.title = updates.title;
      }
      if (typeof updates.body === "string") {
        updateData.body = updates.body;
      }
      if (typeof updates.enabled === "boolean") {
        updateData.enabled = updates.enabled;
      }
      if (Array.isArray(updates.links)) {
        updateData.links = updates.links;
      } else if (Object.hasOwn(updates, "links") && !updates.links) {
        updateData.links = deleteField();
      }

      if (Object.keys(updateData).length === 0) {
        throw new ApiException("Inga uppdateringar tillhandahölls", CLIENT_ERROR_STATUS);
      }

      await updateDoc(announcementDoc, updateData);

      return announcementsApi.getAnnouncement();
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        error instanceof Error ? error.message : "Failed to update announcement",
        0
      );
    }
  },
};
