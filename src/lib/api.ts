import type {
  ApiError,
  CreatePostInput,
  PaginationParams,
  Post,
  UpdatePostInput,
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
