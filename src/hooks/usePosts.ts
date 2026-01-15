import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { postsApi } from "@/lib/api";

import type {
  CreatePostInput,
  PaginationParams,
  Post,
  UpdatePostInput,
} from "@/types/api";

/**
 * Query keys for posts
 */
export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...postKeys.lists(), params] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of posts with optional pagination
 */
export const usePostsQuery = (params?: PaginationParams) => {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postsApi.getPosts(params),
  });
};

/**
 * Hook to fetch a single post by ID
 */
export const usePostQuery = (id: number) => {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postsApi.getPost(id),
    enabled: id > 0, // Only fetch if ID is valid
  });
};

/**
 * Hook to create a new post
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostInput) => postsApi.createPost(data),
    onSuccess: (newPost) => {
      // Invalidate and refetch posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      // Optionally add the new post to the cache
      queryClient.setQueryData(postKeys.detail(newPost.id), newPost);
    },
  });
};

/**
 * Hook to update an existing post with optimistic updates
 */
export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePostInput }) =>
      postsApi.updatePost(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: postKeys.detail(id) });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData<Post>(postKeys.detail(id));

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData<Post>(postKeys.detail(id), {
          ...previousPost,
          ...data,
        });
      }

      return { previousPost };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(postKeys.detail(id), context.previousPost);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
    },
  });
};

/**
 * Hook to delete a post with cache invalidation
 */
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => postsApi.deletePost(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};
