import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { BLOG_TAGS } from "@noalhub/api/blog/server";

/** Không được cache: nó là cửa nhận lệnh, không phải trang. */
export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
/** Body vài nghìn phần tử là một cần gạt DoS — mỗi phần tử là một lệnh xoá cache. */
const MAX_ITEMS_PER_ARRAY = 50;

/**
 * Webhook revalidate — **backend** gọi sau khi đổi trạng thái bài
 * (`docs/blog-plan.md` §5.2).
 *
 * ```
 * POST http://web:3000/api/revalidate        (nội bộ trong docker network)
 * x-revalidate-secret: <shared secret>
 * { "slugs": ["bai-viet-abc", "slug-cu"], "categories": ["huong-dan"], "tags": ["react"] }
 * ```
 *
 * ⚠️ **Người gọi phải là backend, không phải `apps/admin`.** Admin là code chạy
 * trong trình duyệt — nhét secret vào đó là công khai secret, còn gọi không
 * secret là mở cho bất kỳ ai spam revalidate. Backend gọi ngay tại chỗ nó đổi
 * `status` thì MỌI đường làm bài published (nút bấm, script seed, đồng bộ sau
 * này) đều kéo theo revalidate, không sót đường nào.
 *
 * ⚠️ Đây là đường **nội bộ**: nginx `deny all` cho `location = /api/revalidate`
 * ở server block công khai (§5.2c). Secret là lớp hai, không phải lớp duy nhất.
 *
 * ⚠️ ISR cache nằm **trong từng container**. Hiện chỉ có một container `web` nên
 * không sao; ngày nào scale lên 2 replica thì một cú webhook chỉ làm mới đúng
 * một cái — lúc đó cần shared cache handler.
 */
export async function POST(request: Request) {
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!secret) {
    // Chưa cấu hình thì từ chối hẳn thay vì mở cửa không khoá. Blog vẫn đúng,
    // chỉ chậm: ISR 60 giây là lưới an toàn có sẵn (§5.1).
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  if (!isValidSecret(request.headers.get("x-revalidate-secret"), secret)) {
    // Sai hoặc thiếu secret → 401 và KHÔNG nói gì thêm (§5.2a).
    return new Response(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const slugs = readSlugArray(body, "slugs");
  const categories = readSlugArray(body, "categories");
  const tags = readSlugArray(body, "tags");

  if (slugs === null || categories === null || tags === null) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  /**
   * Chỉ dùng `revalidateTag`, KHÔNG `revalidatePath`: `/blogs` và
   * `/blogs?page=2` là hai path khác nhau nên `revalidatePath("/blogs")` không
   * đụng tới trang 2, còn một tag thì phủ hết (§5.2).
   *
   * Tên tag do **phía web tự dựng** từ slug nhận được — body không mang tên tag
   * hay đường dẫn nào. Nếu không thì endpoint này thành công cụ ép render bất kỳ
   * route nào của app.
   *
   * `{ expire: 0 }` chứ không `"max"`: `"max"` là stale-while-revalidate, tức là
   * lượt F5 đầu tiên sau khi Publish vẫn thấy bản cũ. Yêu cầu của §5.2 là "bấm
   * Publish, F5 thấy ngay". `updateTag` cho ngữ nghĩa đó nhưng chỉ chạy được
   * trong Server Action, không phải Route Handler — nên `{ expire: 0 }` là dạng
   * đúng cho webhook, và docs của Next nói thẳng như vậy.
   */
  const expireNow = { expire: 0 };

  revalidateTag(BLOG_TAGS.list, expireNow);
  revalidateTag(BLOG_TAGS.sitemap, expireNow);
  revalidateTag(BLOG_TAGS.categories, expireNow);
  revalidateTag(BLOG_TAGS.tags, expireNow);

  // `slugs` là số NHIỀU vì đổi slug phải xoá cả bản cũ lẫn bản mới (§2.4, §5.2b).
  for (const slug of slugs) revalidateTag(BLOG_TAGS.post(slug), expireNow);
  // Dời bài sang mục khác thì backend gửi CẢ mục cũ lẫn mục mới; gỡ một thẻ
  // cũng vậy, nếu không `/blogs/tag/<cũ>` còn liệt kê bài đó thêm 300 giây.
  for (const slug of categories) revalidateTag(BLOG_TAGS.category(slug), expireNow);
  for (const slug of tags) revalidateTag(BLOG_TAGS.tag(slug), expireNow);

  return Response.json({ revalidated: true, now: Date.now() });
}

/**
 * So sánh **timing-safe**, không phải `===`.
 *
 * `timingSafeEqual` ném khi hai buffer khác độ dài, nên phải kiểm độ dài trước —
 * và chính việc kiểm đó đã rò rỉ độ dài secret. Chấp nhận được: cái cần giấu là
 * nội dung, và đường này đã bị nginx chặn từ ngoài (§5.2c).
 */
function isValidSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * `undefined` → mảng rỗng (trường không bắt buộc). `null` trả về = body sai
 * shape → 400.
 */
function readSlugArray(body: unknown, key: string): string[] | null {
  if (typeof body !== "object" || body === null) return null;

  const value = (body as Record<string, unknown>)[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ITEMS_PER_ARRAY) return null;

  // Regex khớp cho cả ba mảng vì slug bài, slug chuyên mục và slug thẻ cùng một
  // dạng (§2.6). Phần tử sai dạng làm hỏng cả request thay vì bị bỏ qua im
  // lặng: backend gửi sai thì phải biết ngay, không phải đi tìm vì sao cache
  // không xoá.
  return value.every((item) => typeof item === "string" && SLUG_PATTERN.test(item))
    ? (value as string[])
    : null;
}
