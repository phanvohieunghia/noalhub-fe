import "server-only";

import { API_BASE_URL, apiBaseUrlFrom } from "../config";
import {
  blogCategoryListSchema,
  blogPostListSchema,
  blogPostSchema,
  blogSitemapEntryListSchema,
  blogTagListSchema,
} from "./schemas";
import type {
  BlogCategory,
  BlogPost,
  BlogPostList,
  BlogPostListItem,
  BlogPostQuery,
  BlogSitemapEntry,
  BlogTag,
} from "./types";

/**
 * Tầng thứ tư của feature blog: đường đọc **server-only**, chạy ở Server
 * Component của `apps/web`. Song song với `api.ts` chứ không thay nó.
 *
 * Bốn ràng buộc dưới đây đều là lý do kỹ thuật, không phải sở thích
 * (`docs/data-layer.md` §7.1, `docs/blog-plan.md` §4.2):
 *
 * 1. **`import "server-only"` ở dòng đầu.** Lỡ import từ client component thì
 *    lỗi lúc build, không đợi tới lúc chạy.
 * 2. **`fetch` thuần, KHÔNG dùng `http` (axios) của `client.ts`.** Next chỉ cắm
 *    cache/ISR vào `fetch` của chính nó; đi qua axios là mất sạch
 *    `next: { revalidate, tags }` — trang fetch lại mỗi request, ISR thành vô
 *    nghĩa mà build vẫn xanh nên rất khó phát hiện. Thêm nữa `client.ts` kéo
 *    theo token-store (zustand, `localStorage`), thứ không tồn tại trên server.
 * 3. **Vẫn `schema.parse` như tầng api.** Mất response interceptor thì phải tự
 *    validate; không thì backend đổi shape sẽ làm hỏng trang public mà không ai
 *    biết.
 * 4. **404 phải phân biệt được**: hàm đọc một bản ghi trả `null` khi 404 để
 *    route gọi `notFound()`; **mọi lỗi khác thì ném** để `error.tsx` lo. Đảo hai
 *    thứ này là hoặc Google gỡ bài thật khỏi index vì API sập một lần, hoặc
 *    Google thử lại mãi một URL không tồn tại (§6.4).
 */

/* --------------------------------- Cache tag -------------------------------- */

/**
 * Tên tag — nguồn sự thật DUY NHẤT, dùng chung với `POST /api/revalidate`
 * (§5.2). Route handler đó **tự dựng tên tag** từ slug nhận được thay vì nhận
 * tên tag từ body; nó gọi đúng các hàm dưới đây nên hai bên không thể lệch.
 *
 * Vì sao chỉ dùng `revalidateTag`, không `revalidatePath`: `/blogs` và
 * `/blogs?page=2` là **hai path khác nhau**, nên `revalidatePath("/blogs")`
 * không đụng tới trang 2, còn một tag thì phủ hết.
 */
export const BLOG_TAGS = {
  list: "blog-list",
  categories: "blog-categories",
  tags: "blog-tags",
  sitemap: "blog-sitemap",
  post: (slug: string) => `blog-post:${slug}`,
  category: (slug: string) => `blog-category:${slug}`,
  tag: (slug: string) => `blog-tag:${slug}`,
} as const;

/**
 * Số bài mỗi trang công khai (§4.5). Trần của backend là 50; con số này định
 * nghĩa luôn "vượt tổng số trang" ở `/blogs`, nên đừng để mỗi chỗ một giá trị.
 */
export const BLOG_PAGE_SIZE = 10;

/** Bài liên quan lấy 4 rồi loại bài hiện tại, còn 3 (§2.5). */
const RELATED_FETCH_LIMIT = 4;
const RELATED_DISPLAY_COUNT = 3;

const LIST_REVALIDATE = 60;
const DETAIL_REVALIDATE = 300;
const TAXONOMY_REVALIDATE = 3600;

/* ---------------------------------- Fetch ---------------------------------- */

/** Lỗi không-404 từ đường đọc công khai. `error.tsx` của `/blogs` bắt nó (§6.4). */
export class BlogServerError extends Error {
  readonly status: number;

  constructor(status: number, path: string) {
    super(`Không đọc được dữ liệu blog (${status}) từ ${path}`);
    this.name = "BlogServerError";
    this.status = status;
  }
}

/**
 * Base URL khi fetch **ở server**.
 *
 * `NEXT_PUBLIC_API_BASE_URL` bị inline lúc build và trỏ ra domain công khai;
 * container Next dùng chính nó thì request đi ra internet, vòng qua nginx rồi
 * quay lại cùng máy. `API_INTERNAL_URL` là biến **runtime** (không
 * `NEXT_PUBLIC_`) trỏ thẳng vào service backend trong docker network (§4.3).
 *
 * Đọc trong hàm chứ không ở module scope: giá trị chỉ có lúc chạy, còn lúc
 * `next build` trên CI runner thì không — và khi đó rơi về URL công khai là
 * hành vi đúng (§4.4a).
 */
function serverApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL;
  return internal ? apiBaseUrlFrom(internal) : API_BASE_URL;
}

type FetchOptions = {
  params?: Record<string, string | number | undefined>;
  tags: string[];
  revalidate: number;
};

/**
 * `next` là phần Next thêm vào `RequestInit` của Web API — nó chỉ có kiểu khi
 * `next/types/global.d.ts` được nạp, mà package này **cố tình không phụ thuộc
 * `next`** (nó là tầng dữ liệu, dùng được ngoài React lẫn ngoài Next).
 *
 * Khai lại đúng hình dạng đó ở đây thay vì kéo cả `next` vào `devDependencies`.
 * Runtime không đổi: `fetch` đã bị Next vá và nó đọc thẳng `init.next`.
 */
type NextFetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

/**
 * Trả `null` khi 404, ném `BlogServerError` với mọi mã lỗi khác — xem ràng buộc
 * (4) ở đầu file.
 */
async function getJson(
  path: string,
  { params, tags, revalidate }: FetchOptions,
): Promise<unknown | null> {
  const url = new URL(`${serverApiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  // Gán qua biến có kiểu chứ không truyền object literal thẳng: literal sẽ bị
  // excess-property check của TS chặn vì `RequestInit` gốc không có `next`.
  const init: NextFetchInit = {
    headers: { Accept: "application/json" },
    next: { revalidate, tags },
  };

  const response = await fetch(url, init);

  if (response.status === 404) return null;
  if (!response.ok) throw new BlogServerError(response.status, path);

  return response.json();
}

/* --------------------------------- Bài viết -------------------------------- */

/**
 * `GET /blog/posts` — chỉ bài `published`, sort `publishedAt DESC` (lọc ở
 * backend, không phải ở FE).
 *
 * Mọi lượt gọi đều mang tag `blog-list`; lọc theo chuyên mục/thẻ thì mang thêm
 * tag riêng của lát cắt đó, để webhook §5.2 xoá đúng phần cần xoá.
 */
export async function getPublishedPosts(
  query: BlogPostQuery = {},
): Promise<BlogPostList> {
  // Kiểu tường minh: `BLOG_TAGS` là `as const` nên suy kiểu sẽ ra mảng literal
  // `"blog-list"[]` và không push thêm tag nào vào được.
  const tags: string[] = [BLOG_TAGS.list];
  if (query.category) tags.push(BLOG_TAGS.category(query.category));
  if (query.tag) tags.push(BLOG_TAGS.tag(query.tag));

  const data = await getJson("/blog/posts", {
    params: {
      page: query.page,
      limit: query.limit ?? BLOG_PAGE_SIZE,
      category: query.category,
      tag: query.tag,
    },
    tags,
    revalidate: LIST_REVALIDATE,
  });

  // Danh sách không có ca 404 hợp lệ: `?category=khong-ton-tai` là lỗi backend
  // hoặc lỗi contract, không phải "trang này không tồn tại". Route kiểm tra
  // chuyên mục/thẻ có thật bằng `getBlogCategory`/`getBlogTag` trước đó (§6.5).
  if (data === null) throw new BlogServerError(404, "/blog/posts");

  return blogPostListSchema.parse(data);
}

/**
 * `GET /blog/posts/{slug}` — `null` khi không tồn tại **hoặc chưa publish**
 * (backend không phân biệt hai ca: phân biệt là mở kênh dò slug bài nháp, §2.1).
 *
 * ⚠️ Bài trả về có thể mang **slug khác** slug đã hỏi: backend tra bảng
 * `blog_post_slugs` nên URL cũ vẫn ra bài, nhưng body là slug mới (§2.4). Chỗ
 * gọi phải so `post.slug !== slug` rồi `permanentRedirect` — nếu không, hai URL
 * cùng nội dung và backlink cũ không dồn về đâu cả.
 */
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const data = await getJson(`/blog/posts/${encodeURIComponent(slug)}`, {
    // Tag theo slug ĐÃ HỎI: webhook gửi cả slug cũ lẫn slug mới khi đổi slug
    // (§5.2b), nên bản cache dưới URL cũ cũng bị xoá.
    tags: [BLOG_TAGS.post(slug)],
    revalidate: DETAIL_REVALIDATE,
  });

  return data === null ? null : blogPostSchema.parse(data);
}

/**
 * Bài liên quan — dùng lại `GET /blog/posts`, **không** thêm endpoint (§2.5).
 *
 * Lọc theo **chuyên mục** chứ không theo thẻ: mỗi bài có đúng một chuyên mục
 * nên đây là truy vấn xác định, còn thứ tự của `tags` không được contract cam
 * kết là có nghĩa. Lấy 4 để bù cho bài hiện tại bị loại — không thì bài nào
 * cũng chỉ còn 2.
 */
export async function getRelatedPosts(
  categorySlug: string,
  excludeSlug: string,
): Promise<BlogPostListItem[]> {
  const { items } = await getPublishedPosts({
    category: categorySlug,
    limit: RELATED_FETCH_LIMIT,
  });

  return items
    .filter((item) => item.slug !== excludeSlug)
    .slice(0, RELATED_DISPLAY_COUNT);
}

/** Vài bài mới nhất — dùng cho `not-found.tsx` của `/blogs` (§2.5, §6.4). */
export async function getLatestPosts(limit = 3): Promise<BlogPostListItem[]> {
  const { items } = await getPublishedPosts({ limit });
  return items;
}

/* --------------------------- Chuyên mục và thẻ ----------------------------- */

/**
 * `GET /blog/categories` — `postCount` chỉ đếm bài `published` (§2.1). Dùng cho
 * nav của layout công khai và cho trang chuyên mục.
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const data = await getJson("/blog/categories", {
    tags: [BLOG_TAGS.categories],
    revalidate: TAXONOMY_REVALIDATE,
  });
  if (data === null) return [];

  return blogCategoryListSchema
    .parse(data)
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "vi"));
}

/**
 * Một chuyên mục theo slug. Không có endpoint riêng và cũng không cần: danh
 * sách chuyên mục là tập nhỏ, đã cache sẵn dưới tag `blog-categories`, nên tra
 * trong đó rẻ hơn một endpoint mới phải nuôi mãi.
 *
 * `undefined` = chuyên mục không tồn tại → route gọi `notFound()` (§6.5).
 */
export async function getBlogCategory(
  slug: string,
): Promise<BlogCategory | undefined> {
  const categories = await getBlogCategories();
  return categories.find((category) => category.slug === slug);
}

/** `GET /blog/tags` — chỉ mục thẻ ở `/blogs/tag`. KHÔNG dùng cho sitemap (§2.6). */
export async function getBlogTags(): Promise<BlogTag[]> {
  const data = await getJson("/blog/tags", {
    tags: [BLOG_TAGS.tags],
    revalidate: TAXONOMY_REVALIDATE,
  });
  if (data === null) return [];

  return blogTagListSchema
    .parse(data)
    .slice()
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name, "vi"));
}

export async function getBlogTag(slug: string): Promise<BlogTag | undefined> {
  const tags = await getBlogTags();
  return tags.find((tag) => tag.slug === slug);
}

/**
 * `GET /blog/sitemap-entries` — **mọi** bài published, không phân trang.
 *
 * Endpoint riêng chứ không phải `GET /blog/posts?limit=…`: khi số bài vượt
 * limit thì sitemap **âm thầm thiếu URL**, build vẫn xanh nên không ai phát
 * hiện (§2.1).
 */
export async function getBlogSitemapEntries(): Promise<BlogSitemapEntry[]> {
  const data = await getJson("/blog/sitemap-entries", {
    tags: [BLOG_TAGS.sitemap],
    revalidate: TAXONOMY_REVALIDATE,
  });
  if (data === null) return [];

  return blogSitemapEntryListSchema.parse(data);
}
