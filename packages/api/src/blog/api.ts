import { http } from "../client";
import {
  adminBlogPostListSchema,
  blogCategoryListSchema,
  blogCategorySchema,
  blogPostSchema,
  blogTagListSchema,
  blogTagSchema,
} from "./schemas";
import { toBlogPostPayload } from "./schemas";
import type { BlogCategoryFormValues } from "./schemas";
import type {
  AdminBlogPostList,
  AdminBlogPostQuery,
  BlogCategory,
  BlogPost,
  BlogTag,
} from "./types";

/**
 * The blog feature's **client** path — used only by `apps/admin` (§4 and §7.3
 * of `docs/data-layer.md`). Every endpoint here needs a token plus the `admin`
 * role.
 *
 * Public pages do NOT go through this file: they read via `./server.ts` (a
 * plain fetch, no token, with Next's cache/ISR). Two parallel paths,
 * deliberately — the full reasoning is in `docs/data-layer.md` §7.
 *
 * Contract: `/admin/blog/*` in `/docs-json` (tag `admin-blog`).
 */

/* ----------------------------------- Posts --------------------------------- */

/**
 * The write payload. Its asymmetry with the read path is **deliberate** (§2.3):
 * writes send `categoryId`/`tagIds`, reads receive `category`/`tags` already
 * expanded to `{ slug, name }`.
 *
 * Inferred straight from `toBlogPostPayload` rather than redeclared: two
 * declarations of one shape drift sooner or later, and drift here means sending
 * the wrong thing to the backend.
 */
export type BlogPostWritePayload = ReturnType<typeof toBlogPostPayload>;

/** `PATCH` sends the `version` being held — a mismatch is a 409 `POST_CONFLICT` (§7.3). */
export type UpdateBlogPostInput = BlogPostWritePayload & { version: number };

/**
 * GET /admin/blog/posts → 200 `{ items, total, page, limit }`. 403, 429.
 *
 * The admin table: **every** status, sorted `updatedAt DESC` — unlike the
 * public list (`publishedAt DESC`). Do not align the two sorts for
 * "consistency": fixing a typo in an old post must not push it to the top of
 * the blog (§2.1a).
 */
export async function listAdminBlogPosts(
  query: AdminBlogPostQuery = {},
  signal?: AbortSignal,
): Promise<AdminBlogPostList> {
  const params: Record<string, string | number> = {};
  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.q) params.q = query.q;
  if (query.status) params.status = query.status;

  const { data } = await http.get<AdminBlogPostList>("/admin/blog/posts", {
    params,
    authRequired: true,
    schema: adminBlogPostListSchema,
    signal,
  });
  return data;
}

/**
 * GET /admin/blog/posts/{id} → 200 `BlogPostDto`. 403, 404 `POST_NOT_FOUND`.
 *
 * By **id**, not slug: slugs change, ids do not (§2.2).
 */
export async function getAdminBlogPost(
  id: string,
  signal?: AbortSignal,
): Promise<BlogPost> {
  const { data } = await http.get<BlogPost>(
    `/admin/blog/posts/${encodeURIComponent(id)}`,
    { authRequired: true, schema: blogPostSchema, signal },
  );
  return data;
}

/**
 * POST /admin/blog/posts → 201 `BlogPostDto`.
 *
 * Creates an empty draft. `/posts/new` calls this and immediately
 * `router.replace`s to `/posts/[id]`, so every later action has exactly ONE
 * save path (§7.1). The slug is generated and kept unique by the backend — the
 * frontend does not guess it.
 */
export async function createBlogPost(
  input: { title: string } = { title: "Bài viết không tên" },
): Promise<BlogPost> {
  const { data } = await http.post<BlogPost>("/admin/blog/posts", input, {
    authRequired: true,
    schema: blogPostSchema,
  });
  return data;
}

/**
 * PATCH /admin/blog/posts/{id} → 200 `BlogPostDto`.
 * 409 `POST_CONFLICT` on a `version` mismatch, 409 `SLUG_TAKEN` when the slug is taken.
 */
export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput,
): Promise<BlogPost> {
  const { data } = await http.patch<BlogPost>(
    `/admin/blog/posts/${encodeURIComponent(id)}`,
    input,
    { authRequired: true, schema: blogPostSchema },
  );
  return data;
}

/**
 * POST /admin/blog/posts/{id}/publish → 200 `BlogPostDto`.
 * 422 `POST_NOT_PUBLISHABLE` when a required field is missing (including the
 * **category**).
 *
 * Separate from `PATCH` because it differs in auditing, validation and side
 * effects: it sets `publishedAt` and the backend fires the revalidate webhook
 * (§5.2). The frontend does **not** call that webhook — see §5.2.
 */
export async function publishBlogPost(id: string): Promise<BlogPost> {
  const { data } = await http.post<BlogPost>(
    `/admin/blog/posts/${encodeURIComponent(id)}/publish`,
    undefined,
    { authRequired: true, schema: blogPostSchema },
  );
  return data;
}

/** POST /admin/blog/posts/{id}/unpublish → 200. Takes it off the public site, keeps the content. */
export async function unpublishBlogPost(id: string): Promise<BlogPost> {
  const { data } = await http.post<BlogPost>(
    `/admin/blog/posts/${encodeURIComponent(id)}/unpublish`,
    undefined,
    { authRequired: true, schema: blogPostSchema },
  );
  return data;
}

/**
 * DELETE /admin/blog/posts/{id} → 204.
 *
 * A **soft delete**: the backend moves it to `status = archived`, the row stays
 * in the DB and the slug stays taken (§2.2). There is no hard delete in the UI —
 * hard-deleting an indexed post leaves a permanent 404 in Google.
 */
export async function archiveBlogPost(id: string): Promise<void> {
  await http.delete(`/admin/blog/posts/${encodeURIComponent(id)}`, {
    authRequired: true,
  });
}

/* -------------------------------- Categories ------------------------------- */

/**
 * GET /admin/blog/categories → 200 `BlogCategoryDto[]`.
 * `postCount` includes **drafts** — unlike the public `/blog/categories` (§2.2).
 */
export async function listAdminBlogCategories(
  signal?: AbortSignal,
): Promise<BlogCategory[]> {
  const { data } = await http.get<BlogCategory[]>("/admin/blog/categories", {
    authRequired: true,
    schema: blogCategoryListSchema,
    signal,
  });
  return data;
}

/** POST /admin/blog/categories → 201. 409 `CATEGORY_SLUG_TAKEN`. */
export async function createBlogCategory(
  input: BlogCategoryFormValues,
): Promise<BlogCategory> {
  const { data } = await http.post<BlogCategory>(
    "/admin/blog/categories",
    input,
    { authRequired: true, schema: blogCategorySchema },
  );
  return data;
}

/**
 * PATCH /admin/blog/categories/{id} → 200.
 *
 * ⚠️ Changing the **slug** breaks the already-indexed
 * `/blogs/category/<old>`: categories have NO history table like posts'
 * `blog_post_slugs` (§2.6). The UI must warn plainly that the old URL 404s
 * permanently — it is not "going to be redirected".
 */
export async function updateBlogCategory(
  id: string,
  input: BlogCategoryFormValues,
): Promise<BlogCategory> {
  const { data } = await http.patch<BlogCategory>(
    `/admin/blog/categories/${encodeURIComponent(id)}`,
    input,
    { authRequired: true, schema: blogCategorySchema },
  );
  return data;
}

/**
 * PUT /admin/blog/categories/reorder → 204.
 *
 * Send **every** id in the new order; the backend reassigns `order` to each
 * array position inside one transaction. Missing, extra or duplicate ids →
 * 400 `VALIDATION_FAILED`.
 */
export async function reorderBlogCategories(ids: string[]): Promise<void> {
  await http.put("/admin/blog/categories/reorder", { ids }, {
    authRequired: true,
  });
}

/**
 * DELETE /admin/blog/categories/{id} → 204.
 * 409 `CATEGORY_NOT_EMPTY` (with the post count) while the category still has
 * posts — a post without a category cannot be published, so deleting carelessly
 * orphans live posts (§2.6).
 */
export async function deleteBlogCategory(id: string): Promise<void> {
  await http.delete(`/admin/blog/categories/${encodeURIComponent(id)}`, {
    authRequired: true,
  });
}

/* ----------------------------------- Tags ---------------------------------- */

/** GET /admin/blog/tags → 200. Feeds the editor's multi-select. */
export async function listAdminBlogTags(
  signal?: AbortSignal,
): Promise<BlogTag[]> {
  const { data } = await http.get<BlogTag[]>("/admin/blog/tags", {
    authRequired: true,
    schema: blogTagListSchema,
    signal,
  });
  return data;
}

/**
 * POST /admin/blog/tags → 201 (or 200 when the tag already exists).
 *
 * The backend `slugify`s `name` itself and, **on a slug collision, returns the
 * existing tag** rather than a 409: the author just wants the tag attached and
 * does not care whether it is new (§2.2).
 */
export async function createBlogTag(name: string): Promise<BlogTag> {
  const { data } = await http.post<BlogTag>(
    "/admin/blog/tags",
    { name },
    { authRequired: true, schema: blogTagSchema },
  );
  return data;
}
