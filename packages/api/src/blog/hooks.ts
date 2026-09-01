"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as blogApi from "./api";
import type { UpdateBlogPostInput } from "./api";
import type { BlogCategoryFormValues } from "./schemas";
import type { AdminBlogPostQuery, BlogCategory, BlogPost } from "./types";

/**
 * Đường **client** — chỉ `apps/admin` dùng. Trang công khai của `apps/web` đọc
 * bằng `@noalhub/api/blog/server` (§4 của `docs/blog-plan.md`), không qua đây:
 * React Query fetch ở client thì HTML đầu tiên rỗng và `generateMetadata`
 * không có dữ liệu — tức là không có SEO.
 *
 * Query key factory là nguồn sự thật DUY NHẤT cho key của feature này.
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
 * Bảng bài viết. `keepPreviousData` để bảng không nháy về skeleton mỗi lần đổi
 * trang hay gõ ô tìm kiếm — cùng lý do với `useAdminUsers`.
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
    // Editor sửa thẳng bản live và không autosave (§7.3): refetch nền sẽ ghi đè
    // bản đang gõ dở bằng bản trên server. `version` + 409 mới là cơ chế phát
    // hiện xung đột, không phải refetch.
    staleTime: Infinity,
    refetchOnMount: false,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: { title: string }) => blogApi.createBlogPost(input),
    onSuccess: (post) => {
      // Ghi thẳng detail vào cache: `/posts/new` replace sang `/posts/[id]`
      // ngay sau đó, không phải fetch lại bài vừa tạo.
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
 * Publish và unpublish đổi `postCount` của chuyên mục/thẻ, nên phải invalidate
 * cả hai danh sách đó — không chỉ danh sách bài.
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

/** Xoá **mềm** (`status = archived`, §2.2) — bản ghi vẫn còn nên chỉ invalidate. */
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
      // Đổi tên mục là đổi `category.name` nở sẵn trong mọi bài đang cache.
      queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
    },
  });
}

/**
 * Kéo-thả sắp xếp chuyên mục.
 *
 * Optimistic: danh sách phải nhảy ngay dưới ngón tay, chờ round-trip mới đổi
 * chỗ là cảm giác kéo bị "trượt". Lỗi thì trả lại snapshot cũ.
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

/** Tạo thẻ ngay trong editor; trùng slug thì backend trả thẻ đang có (§2.2). */
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
