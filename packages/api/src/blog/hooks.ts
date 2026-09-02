"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as blogApi from "./api";
import type { UpdateBlogPostInput } from "./api";
import type { BlogCategoryFormValues } from "./schemas";
import type { AdminBlogPostQuery, BlogCategory, BlogPost } from "./types";

/**
 * The **client** path — used only by `apps/admin`. The public pages of
 * `apps/web` read through `@noalhub/api/blog/server` (§4 of `docs/blog.md`),
 * never through here: with React Query fetching on the client the first HTML is
 * empty and `generateMetadata` has no data — which means no SEO.
 *
 * The query key factory is the ONLY source of truth for this feature's keys.
 */
export const blogKeys = {
  all: ["blog"] as const,
  posts: () => [...blogKeys.all, "posts"] as const,
  postList: (query: AdminBlogPostQuery) =>
    [...blogKeys.posts(), "list", query] as const,
  postDetail: (id: string) => [...blogKeys.posts(), "detail", id] as const,
  categories: () => [...blogKeys.all, "categories"] as const,
  tags: () => [...blogKeys.all, "tags"] as const,
};

/**
 * The post table. `keepPreviousData` keeps it from flashing back to a skeleton
 * on every page change or keystroke — the same reason as `useAdminUsers`.
 */
export function useAdminBlogPosts(query: AdminBlogPostQuery = {}) {
  return useQuery({
    queryKey: blogKeys.postList(query),
    queryFn: ({ signal }) => blogApi.listAdminBlogPosts(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: blogKeys.postDetail(id ?? ""),
    queryFn: ({ signal }) => blogApi.getAdminBlogPost(id!, signal),
    enabled: Boolean(id),
    // The editor edits the live record and does not autosave (§7.3): a
    // background refetch would overwrite the half-typed draft with the server's
    // copy. `version` plus a 409 is the conflict-detection mechanism, not
    // refetching.
    staleTime: Infinity,
    refetchOnMount: false,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: { title: string }) => blogApi.createBlogPost(input),
    onSuccess: (post) => {
      // Write the detail straight into the cache: `/posts/new` replaces to
      // `/posts/[id]` right after, so the new post need not be fetched again.
      queryClient.setQueryData(blogKeys.postDetail(post.id), post);
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
    },
  });
}

export function useUpdateBlogPost(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBlogPostInput) => blogApi.updateBlogPost(id, input),
    onSuccess: (post) => writePostToCache(queryClient, post),
  });
}

/**
 * Publish and unpublish change the `postCount` of categories and tags, so both
 * of those lists must be invalidated — not just the post list.
 */
export function usePublishBlogPost(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => blogApi.publishBlogPost(id),
    onSuccess: (post) => {
      writePostToCache(queryClient, post);
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
      queryClient.invalidateQueries({ queryKey: blogKeys.tags() });
    },
  });
}

export function useUnpublishBlogPost(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => blogApi.unpublishBlogPost(id),
    onSuccess: (post) => {
      writePostToCache(queryClient, post);
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
      queryClient.invalidateQueries({ queryKey: blogKeys.tags() });
    },
  });
}

/** A **soft** delete (`status = archived`, §2.2) — the record remains, so only invalidate. */
export function useArchiveBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogApi.archiveBlogPost(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.postDetail(id) });
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
}

export function useAdminBlogCategories() {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: ({ signal }) => blogApi.listAdminBlogCategories(signal),
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BlogCategoryFormValues) =>
      blogApi.createBlogCategory(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() }),
  });
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BlogCategoryFormValues }) =>
      blogApi.updateBlogCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
      // Renaming a category changes the `category.name` expanded into every cached post.
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
    },
  });
}

/**
 * Drag-and-drop category ordering.
 *
 * Optimistic: the list has to move under the finger immediately — waiting for a
 * round-trip before reordering feels like the drag "slipped". On error the old
 * snapshot is restored.
 */
export function useReorderBlogCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => blogApi.reorderBlogCategories(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: blogKeys.categories() });
      const previous = queryClient.getQueryData<BlogCategory[]>(
        blogKeys.categories(),
      );

      if (previous) {
        const byId = new Map(previous.map((category) => [category.id, category]));
        const next = ids
          .map((id, index) => {
            const category = byId.get(id);
            return category ? { ...category, order: index } : null;
          })
          .filter((category): category is BlogCategory => category !== null);
        queryClient.setQueryData(blogKeys.categories(), next);
      }

      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(blogKeys.categories(), context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() }),
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => blogApi.deleteBlogCategory(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() }),
  });
}

export function useAdminBlogTags() {
  return useQuery({
    queryKey: blogKeys.tags(),
    queryFn: ({ signal }) => blogApi.listAdminBlogTags(signal),
  });
}

/** Create a tag from inside the editor; on a slug collision the backend returns the existing one (§2.2). */
export function useCreateBlogTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => blogApi.createBlogTag(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: blogKeys.tags() }),
  });
}

function writePostToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  post: BlogPost,
) {
  queryClient.setQueryData(blogKeys.postDetail(post.id), post);
  queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
}
