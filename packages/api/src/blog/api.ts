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
 * Đường **client** của feature blog — chỉ `apps/admin` dùng (§4, §7.3 của
 * `docs/data-layer.md`). Mọi endpoint ở đây cần token + role `admin`.
 *
 * Trang công khai KHÔNG đi qua file này: nó đọc bằng `./server.ts` (fetch thuần,
 * không token, có cache/ISR của Next). Hai đường song song, cố ý — lý do đầy đủ
 * ở `docs/data-layer.md` §7.
 *
 * Contract: `/admin/blog/*` trong `/docs-json` (tag `admin-blog`).
 */

/* --------------------------------- Bài viết -------------------------------- */

/**
 * Payload ghi. Bất đối xứng với đường đọc là **cố ý** (§2.3): ghi gửi
 * `categoryId`/`tagIds`, đọc nhận `category`/`tags` đã nở `{ slug, name }`.
 *
 * Suy thẳng từ `toBlogPostPayload` thay vì khai lại: hai khai báo cho cùng một
 * hình dạng thì sớm muộn cũng lệch, và lệch ở đây nghĩa là gửi sai lên backend.
 */
export type BlogPostWritePayload = ReturnType<typeof toBlogPostPayload>;

/** `PATCH` gửi kèm `version` đang giữ — lệch thì 409 `POST_CONFLICT` (§7.3). */
export type UpdateBlogPostInput = BlogPostWritePayload & { version: number };

/**
 * GET /admin/blog/posts → 200 `{ items, total, page, limit }`. 403, 429.
 *
 * Bảng quản trị: **mọi** trạng thái, sort `updatedAt DESC` — khác public
 * (`publishedAt DESC`). Đừng đồng bộ hai kiểu sort cho "nhất quán": sửa lỗi
 * chính tả ở bài cũ mà đẩy nó lên đầu trang blog là sai (§2.1a).
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
 * Theo **id**, không theo slug: slug đổi được, id thì không (§2.2).
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
 * Tạo bản nháp rỗng. `/posts/new` gọi hàm này rồi `router.replace` sang
 * `/posts/[id]` ngay, để mọi thao tác sau chỉ có MỘT đường lưu (§7.1).
 * Slug do backend sinh và bảo đảm duy nhất — FE không đoán hộ.
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
 * 409 `POST_CONFLICT` khi `version` lệch, 409 `SLUG_TAKEN` khi slug bị chiếm.
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
 * 422 `POST_NOT_PUBLISHABLE` khi thiếu field bắt buộc (gồm cả **chuyên mục**).
 *
 * Tách khỏi `PATCH` vì khác nhau về audit, về validate, và về side effect:
 * đặt `publishedAt` + backend bắn webhook revalidate (§5.2). FE **không** gọi
 * webhook — lý do ở §5.2.
 */
export async function publishBlogPost(id: string): Promise<BlogPost> {
  const { data } = await http.post<BlogPost>(
    `/admin/blog/posts/${encodeURIComponent(id)}/publish`,
    undefined,
    { authRequired: true, schema: blogPostSchema },
  );
  return data;
}

/** POST /admin/blog/posts/{id}/unpublish → 200. Gỡ công khai, giữ nội dung. */
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
 * **Xoá mềm**: backend chuyển `status = archived`, hàng vẫn nằm trong DB và slug
 * vẫn bị chiếm (§2.2). Không có xoá cứng ở UI — xoá cứng một bài đã index là để
 * lại 404 vĩnh viễn ở Google.
 */
export async function archiveBlogPost(id: string): Promise<void> {
  await http.delete(`/admin/blog/posts/${encodeURIComponent(id)}`, {
    authRequired: true,
  });
}

/* ------------------------------- Chuyên mục -------------------------------- */

/**
 * GET /admin/blog/categories → 200 `BlogCategoryDto[]`.
 * `postCount` tính **cả bài nháp** — khác `/blog/categories` công khai (§2.2).
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
 * ⚠️ Đổi **slug** làm hỏng `/blogs/category/<cũ>` đã index: chuyên mục KHÔNG có
 * bảng lịch sử như `blog_post_slugs` của bài (§2.6). UI phải cảnh báo rõ là URL
 * cũ 404 vĩnh viễn, không phải "sẽ được chuyển hướng".
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
 * Gửi **đủ** id theo thứ tự mới; backend gán lại `order` = vị trí trong mảng,
 * trong một transaction. Thiếu/thừa/trùng id → 400 `VALIDATION_FAILED`.
 */
export async function reorderBlogCategories(ids: string[]): Promise<void> {
  await http.put("/admin/blog/categories/reorder", { ids }, {
    authRequired: true,
  });
}

/**
 * DELETE /admin/blog/categories/{id} → 204.
 * 409 `CATEGORY_NOT_EMPTY` (kèm số bài) khi mục còn bài — bài không có chuyên
 * mục thì không publish được, nên xoá bừa là làm mồ côi bài đang chạy (§2.6).
 */
export async function deleteBlogCategory(id: string): Promise<void> {
  await http.delete(`/admin/blog/categories/${encodeURIComponent(id)}`, {
    authRequired: true,
  });
}

/* ----------------------------------- Thẻ ----------------------------------- */

/** GET /admin/blog/tags → 200. Cấp dữ liệu cho ô multi-select ở editor. */
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
 * POST /admin/blog/tags → 201 (hoặc 200 khi thẻ đã tồn tại).
 *
 * Backend tự `slugify` từ `name`, và **trùng slug thì trả về thẻ đang có** chứ
 * không 409: người viết chỉ muốn gắn thẻ, không quan tâm nó mới hay cũ (§2.2).
 */
export async function createBlogTag(name: string): Promise<BlogTag> {
  const { data } = await http.post<BlogTag>(
    "/admin/blog/tags",
    { name },
    { authRequired: true, schema: blogTagSchema },
  );
  return data;
}
