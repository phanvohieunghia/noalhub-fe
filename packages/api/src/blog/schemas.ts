import {
  BLOG_IMAGE_DEV_HOSTS,
  BLOG_IMAGE_HOSTS,
} from "@noalhub/config/blog-image-hosts.mjs";
import { z } from "zod";

import type {
  BlogBlockNode,
  BlogCategory,
  BlogDoc,
  BlogInlineNode,
  BlogListItemNode,
  BlogMark,
  BlogPost,
  BlogTag,
  BlogTextNode,
} from "./types";

/* ------------------------------------------------------------------------- *
 * Allowlist — nửa FE của trust boundary (§3, §3.1, §3.1a)
 * ------------------------------------------------------------------------- */

/**
 * Node/mark cho phép (§3.1). Danh sách này phải TRÙNG với schema của editor
 * (`apps/admin`), với validate khi ghi ở backend, và với renderer
 * (`packages/ui/src/blog/post-content.tsx`). Lệch một chỗ là dữ liệu ghi được
 * mà không hiện được, hoặc ngược lại.
 */
export const BLOG_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
] as const;

export const BLOG_MARK_TYPES = [
  "bold",
  "italic",
  "strike",
  "code",
  "link",
] as const;

/** `<h1>` là tiêu đề bài (§6.2) — nội dung chỉ h2/h3. */
export const BLOG_HEADING_LEVELS = [2, 3] as const;

/**
 * Ngôn ngữ cho `codeBlock` (§3.1c). Đợt này chỉ LƯU, chưa tô màu — nhưng phải
 * chốt danh sách bây giờ vì `language` là attr trong schema, thêm sau là migrate
 * `jsonb`. Cùng danh sách ở editor, backend và renderer.
 */
export const BLOG_CODE_LANGUAGES = [
  "bash",
  "css",
  "html",
  "javascript",
  "json",
  "php",
  "python",
  "sql",
  "tsx",
  "typescript",
  "yaml",
] as const;

/**
 * Scheme an toàn cho `link.href` (§3.1a).
 *
 * ⚠️ Kiểm bằng `new URL()` rồi so `protocol`, **không** regex trên chuỗi thô:
 * `java\tscript:` lách được regex mà trình duyệt vẫn chạy. Đây chính là stored
 * XSS mà §3 tuyên bố đã đóng — không có hàm này thì tuyên bố đó sai.
 */
const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

/**
 * Host được phép cho `image.src` (§3.1a).
 *
 * Re-export từ `@noalhub/config/blog-image-hosts.mjs`, cũng chính là file mà
 * `images.remotePatterns` của cả hai app đọc. Trước đây danh sách bị chép tay
 * ba chỗ và đã lệch thật; giữ re-export này để phía tiêu thụ vẫn import từ
 * `@noalhub/api/blog` như cũ, không phải biết tới package config.
 */
export { BLOG_IMAGE_DEV_HOSTS, BLOG_IMAGE_HOSTS };

/** Ba segment tĩnh cùng cấp với `/blogs/[slug]` — slug bài trùng là mở không được (§4.5). */
export const RESERVED_POST_SLUGS = ["category", "tag", "rss.xml"] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `href` chỉ được là `http:`/`https:`/`mailto:` — xem `SAFE_LINK_PROTOCOLS`. */
export function isSafeLinkHref(href: unknown): href is string {
  if (typeof href !== "string" || href.length === 0) return false;
  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(href).protocol);
  } catch {
    // URL tương đối (`/gioi-thieu`) không parse được nếu không có base. Bài viết
    // dẫn link nội bộ là chuyện thường, nên cho qua — nhưng chỉ dạng `/…`, để
    // `javascript:…` không lọt qua cửa này.
    return href.startsWith("/") && !href.startsWith("//");
  }
}

/**
 * `src` phải là `https:` + host thuộc `BLOG_IMAGE_HOSTS`, hoặc — chỉ ngoài
 * production — `http:` + host thuộc `BLOG_IMAGE_DEV_HOSTS` (`localhost`).
 *
 * Ngoại lệ `http:` cố tình KHÔNG phải một cờ riêng: nó gắn cứng vào danh sách
 * host dev, vốn rỗng khi `NODE_ENV=production`. Nghĩa là ở production nhánh
 * dưới không thể true dù src có là gì, và ràng buộc "ảnh công khai luôn https"
 * vẫn nguyên vẹn.
 */
export function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== "string" || src.length === 0) return false;
  try {
    const url = new URL(src);
    if (url.protocol === "https:") {
      return BLOG_IMAGE_HOSTS.includes(url.hostname);
    }
    if (url.protocol === "http:") {
      return BLOG_IMAGE_DEV_HOSTS.includes(url.hostname);
    }
    return false;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------- *
 * Làm sạch document (§3.1, §3.1a)
 * ------------------------------------------------------------------------- */

/**
 * Chuẩn hoá một document Tiptap về đúng allowlist: giữ node/mark/attr hợp lệ,
 * **bỏ im lặng** phần còn lại.
 *
 * Vì sao làm sạch chứ không `z.object(...)` nghiêm ngặt: §3.1 yêu cầu "node lạ
 * → renderer bỏ qua im lặng, một node lạ không được làm trắng cả trang". Một
 * schema nghiêm ngặt làm đúng điều ngược lại — bản Tiptap sau thêm một attr là
 * `parse` ném, trang bài viết trả 500. Sạch-và-nới ở đây, nghiêm ngặt ở lớp
 * ngoài (`blogPostSchema`) là chỗ phân chia đúng.
 *
 * Hàm dùng cho CẢ hai chiều: đọc (server.ts + api.ts) và ghi (editor gửi lên).
 * Nhờ vậy thứ lưu ở DB và thứ render ra luôn là cùng một tập.
 */
export function sanitizeBlogDoc(value: unknown): BlogDoc {
  const content = isRecord(value) && value.type === "doc" ? value.content : null;
  return { type: "doc", content: sanitizeBlocks(content) };
}

function sanitizeBlocks(value: unknown): BlogBlockNode[] {
  if (!Array.isArray(value)) return [];
  const blocks: BlogBlockNode[] = [];
  for (const raw of value) {
    const node = sanitizeBlock(raw);
    if (node) blocks.push(node);
  }
  return blocks;
}

function sanitizeBlock(raw: unknown): BlogBlockNode | null {
  if (!isRecord(raw) || typeof raw.type !== "string") return null;
  const attrs = isRecord(raw.attrs) ? raw.attrs : {};

  switch (raw.type) {
    case "paragraph":
      return { type: "paragraph", content: sanitizeInline(raw.content) };

    case "heading": {
      // Level ngoài [2,3] thì hạ về h2 thay vì bỏ cả heading: mất một mục lục
      // còn hơn mất nguyên đoạn nội dung dưới nó.
      const level = attrs.level === 3 ? 3 : 2;
      return {
        type: "heading",
        attrs: { level },
        content: sanitizeInline(raw.content),
      };
    }

    case "bulletList":
    case "orderedList": {
      const items = sanitizeListItems(raw.content);
      return items.length ? { type: raw.type, content: items } : null;
    }

    case "blockquote": {
      const content = sanitizeBlocks(raw.content);
      return content.length ? { type: "blockquote", content } : null;
    }

    case "codeBlock": {
      const language =
        typeof attrs.language === "string" &&
        (BLOG_CODE_LANGUAGES as readonly string[]).includes(attrs.language)
          ? attrs.language
          : null;
      return {
        type: "codeBlock",
        attrs: { language },
        // Trong codeBlock, text không mang mark nào.
        content: sanitizeInline(raw.content).filter(isTextNode),
      };
    }

    case "horizontalRule":
      return { type: "horizontalRule" };

    case "image": {
      // src sai allowlist → bỏ hẳn ảnh (không có "text con" để giữ lại).
      if (!isSafeImageSrc(attrs.src)) return null;
      return {
        type: "image",
        attrs: {
          src: attrs.src,
          alt: typeof attrs.alt === "string" ? attrs.alt : "",
          width: toPositiveInt(attrs.width),
          height: toPositiveInt(attrs.height),
        },
      };
    }

    default:
      // Node lạ (extension của bản Tiptap sau) — bỏ im lặng, không ném (§3.1).
      return null;
  }
}

function sanitizeListItems(value: unknown): BlogListItemNode[] {
  if (!Array.isArray(value)) return [];
  const items: BlogListItemNode[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || raw.type !== "listItem") continue;
    const content = sanitizeBlocks(raw.content);
    if (content.length) items.push({ type: "listItem", content });
  }
  return items;
}

function sanitizeInline(value: unknown): BlogInlineNode[] {
  if (!Array.isArray(value)) return [];
  const nodes: BlogInlineNode[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    if (raw.type === "hardBreak") {
      nodes.push({ type: "hardBreak" });
      continue;
    }
    if (raw.type !== "text" || typeof raw.text !== "string") continue;
    if (raw.text.length === 0) continue;

    const marks = sanitizeMarks(raw.marks);
    nodes.push(marks.length ? { type: "text", text: raw.text, marks } : { type: "text", text: raw.text });
  }
  return nodes;
}

function sanitizeMarks(value: unknown): BlogMark[] {
  if (!Array.isArray(value)) return [];
  const marks: BlogMark[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.type !== "string") continue;
    if (raw.type === "link") {
      const href = isRecord(raw.attrs) ? raw.attrs.href : undefined;
      // href bẩn → bỏ MARK nhưng giữ text (§3.1a): link hỏng thành chữ thường.
      // `target`/`rel` cố tình không đọc từ dữ liệu — renderer tự đặt.
      if (isSafeLinkHref(href)) marks.push({ type: "link", attrs: { href } });
      continue;
    }
    if ((BLOG_MARK_TYPES as readonly string[]).includes(raw.type)) {
      marks.push({ type: raw.type } as BlogMark);
    }
  }
  return marks;
}

function isTextNode(node: BlogInlineNode): node is BlogTextNode {
  return node.type === "text";
}

function toPositiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/* ------------------------------------------------------------------------- *
 * Response schema
 * ------------------------------------------------------------------------- */

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

/** `content` đi qua bộ làm sạch trên, không qua `z.object` — lý do ở §3.1. */
export const blogDocSchema = z.unknown().transform(sanitizeBlogDoc);

export const blogTaxonomyRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const blogAuthorSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: nullableString,
});

export const blogPostSeoSchema = z.object({
  metaTitle: nullableString,
  metaDescription: nullableString,
  canonicalUrl: nullableString,
  ogImageUrl: nullableString,
  noindex: z.boolean().catch(false),
});

export const blogPostStatusSchema = z.enum(["draft", "published", "archived"]);

export const blogPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: nullableString,
  content: blogDocSchema,
  contentText: z.string().catch(""),
  coverImageUrl: nullableString,
  category: blogTaxonomyRefSchema.nullish().transform((v) => v ?? null),
  tags: z.array(blogTaxonomyRefSchema).catch([]),
  status: blogPostStatusSchema,
  publishedAt: nullableString,
  updatedAt: z.string(),
  version: z.number().catch(0),
  author: blogAuthorSchema,
  seo: blogPostSeoSchema,
});

export const blogPostListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().catch(""),
  coverImageUrl: nullableString,
  category: blogTaxonomyRefSchema,
  tags: z.array(blogTaxonomyRefSchema).catch([]),
  publishedAt: z.string(),
  updatedAt: z.string(),
  author: blogAuthorSchema,
  readingMinutes: z.number().catch(1),
});

/**
 * `page`/`limit` dùng `.catch()` chứ không bắt buộc — cùng lý do với
 * `adminUserListSchema`: thiếu hai số echo lại thì phân trang vẫn dựng được từ
 * query đã gửi, không đáng để cả trang vỡ.
 */
export const blogPostListSchema = z.object({
  items: z.array(blogPostListItemSchema),
  total: z.number(),
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const adminBlogPostListSchema = z.object({
  items: z.array(blogPostSchema),
  total: z.number(),
  page: z.number().catch(1),
  limit: z.number().catch(20),
});

export const blogCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: nullableString,
  order: z.number().catch(0),
  postCount: z.number().catch(0),
});

export const blogCategoryListSchema = z.array(blogCategorySchema);

export const blogTagSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  postCount: z.number().catch(0),
});

export const blogTagListSchema = z.array(blogTagSchema);

export const blogSitemapEntrySchema = z.object({
  slug: z.string(),
  updatedAt: z.string(),
});

export const blogSitemapEntryListSchema = z.array(blogSitemapEntrySchema);

/* ------------------------------------------------------------------------- *
 * Input schema — form ở apps/admin
 * ------------------------------------------------------------------------- */

/**
 * ⚠️ Ràng buộc min/max ở đây phải KHỚP DTO backend (`docs/data-layer.md` §5).
 * Đã đối chiếu với `src/admin/dto/blog-write.dto.ts` bên repo `noalhub-be`:
 * title 200, slug 120, excerpt 500, metaTitle 120, metaDescription 320, URL 2048,
 * tối đa 20 thẻ. Đổi một bên mà quên bên kia thì form báo hợp lệ rồi backend trả
 * `VALIDATION_FAILED` — người dùng thấy lỗi ở chỗ không có ô nào sai.
 */
export const blogSlugSchema = z
  .string()
  .trim()
  .min(1, "validation.slug.required")
  .max(120, "validation.slug.tooLong")
  .regex(SLUG_PATTERN, "validation.slug.pattern")
  .refine(
    (slug) => !(RESERVED_POST_SLUGS as readonly string[]).includes(slug),
    // Không phải quy ước thẩm mỹ: ba chuỗi này là segment tĩnh dưới `/blogs`,
    // Next luôn cho segment tĩnh thắng segment động nên bài sẽ không mở được.
    { message: "validation.slug.reserved" },
  );

/**
 * Ô nhập URL của form: **giữ nguyên `string`**, không `.transform()` về `null`.
 *
 * Transform ở đây sẽ làm kiểu vào và kiểu ra của schema khác nhau, mà
 * react-hook-form giữ giá trị theo kiểu VÀO — `value={null}` là input
 * uncontrolled và React cảnh báo. Việc quy `""` về `null` để lên dây là của
 * `toBlogPostPayload` bên dưới, đúng một chỗ.
 */
const linkUrlField = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || isSafeLinkHref(v), "validation.url.invalid");

const imageUrlField = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => v === "" || isSafeImageSrc(v),
    `Ảnh phải thuộc host được phép: ${[...BLOG_IMAGE_HOSTS, ...BLOG_IMAGE_DEV_HOSTS].join(", ")}`,
  );

/**
 * Form của editor — **phẳng**, kể cả nhóm `seo` vốn lồng trong DTO.
 *
 * Phẳng vì form là chuyện của react-hook-form và của panel SEO, còn hình dạng
 * lồng là chuyện của contract; `toBlogPostPayload` nối hai thứ đó lại. Trộn hai
 * hình dạng vào một kiểu là chỗ hay sinh lỗi "sửa DTO thì form câm lặng hỏng".
 *
 * `categorySlug` để rỗng được: **lưu nháp không bắt buộc chọn chuyên mục**. Ràng
 * buộc "bắt buộc khi publish" nằm ở checklist của nút Publish, không ở đây —
 * bắt buộc ngay lúc tạo thì mỗi lần mở `/posts/new` đều phải quyết định một
 * chuyện chưa nghĩ tới (§2.6, §7.4).
 */
export const blogPostFormSchema = z.object({
  title: z.string().trim().min(1, "validation.post.titleRequired").max(200),
  slug: blogSlugSchema,
  excerpt: z.string().trim().max(500),
  // Nội dung không validate từng node ở đây — `sanitizeBlogDoc` lo phần đó lúc
  // dựng payload, và nó LỌC chứ không từ chối (§3.1).
  content: z.custom<BlogDoc>(
    (value) => typeof value === "object" && value !== null,
    "validation.post.contentInvalid",
  ),
  coverImageUrl: imageUrlField,
  categorySlug: z.string(),
  tagSlugs: z.array(z.string()).max(20, "validation.post.tooManyTags"),
  metaTitle: z.string().trim().max(120),
  metaDescription: z.string().trim().max(320),
  canonicalUrl: linkUrlField,
  ogImageUrl: imageUrlField,
  noindex: z.boolean(),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

/**
 * DTO → giá trị form. `null` thành `""` vì input không giữ được `null`.
 *
 * ⚠️ Form giữ **slug** của chuyên mục/thẻ, không giữ id — vì `BlogPostDto` chỉ
 * trả `{ slug, name }` đã nở, không trả id (§2.3). Bất đối xứng đó là cố ý ở
 * phía đọc, nhưng nó đẩy sang phía ghi một việc: đổi slug về id lúc dựng payload
 * (`toBlogPostPayload`), tra trong chính hai danh sách mà editor đã tải sẵn cho
 * ô select và ô thẻ. Không có endpoint nào phải thêm.
 */
export function toBlogPostFormValues(post: BlogPost): BlogPostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImageUrl: post.coverImageUrl ?? "",
    categorySlug: post.category?.slug ?? "",
    tagSlugs: post.tags.map((tag) => tag.slug),
    metaTitle: post.seo.metaTitle ?? "",
    metaDescription: post.seo.metaDescription ?? "",
    canonicalUrl: post.seo.canonicalUrl ?? "",
    ogImageUrl: post.seo.ogImageUrl ?? "",
    noindex: post.seo.noindex,
  };
}

/**
 * Giá trị form → payload lên dây.
 *
 * Bốn việc, đều chỉ làm ở đây: quy `""` về `null`, gom nhóm `seo` lại, đổi slug
 * chuyên mục/thẻ về **id**, và **làm sạch `content` một lần nữa trước khi ghi**
 * — để thứ nằm trong DB đã thuộc allowlist §3.1/§3.1a, không phụ thuộc vào việc
 * editor có gửi đúng hay không.
 *
 * ⚠️ Chỉ gọi khi hai danh sách taxonomy đã tải xong. Slug không tra ra id thì bị
 * bỏ, nên gọi với danh sách rỗng (query đang tải hoặc vừa lỗi) sẽ **âm thầm gỡ
 * hết thẻ và chuyên mục của bài**. Editor vì vậy khoá nút Lưu tới khi cả hai
 * query có dữ liệu — đó là ràng buộc thật, không phải chi tiết trang trí.
 */
export function toBlogPostPayload(
  values: BlogPostFormValues,
  taxonomy: { categories: BlogCategory[]; tags: BlogTag[] },
) {
  const nullable = (value: string) => (value.trim() === "" ? null : value.trim());
  const categoryId =
    taxonomy.categories.find((c) => c.slug === values.categorySlug)?.id ?? null;
  const tagIds = values.tagSlugs
    .map((slug) => taxonomy.tags.find((tag) => tag.slug === slug)?.id)
    .filter((id): id is string => Boolean(id));

  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    excerpt: nullable(values.excerpt),
    content: sanitizeBlogDoc(values.content),
    coverImageUrl: nullable(values.coverImageUrl),
    categoryId,
    tagIds,
    seo: {
      metaTitle: nullable(values.metaTitle),
      metaDescription: nullable(values.metaDescription),
      canonicalUrl: nullable(values.canonicalUrl),
      ogImageUrl: nullable(values.ogImageUrl),
      noindex: values.noindex,
    },
  };
}

/** Doc rỗng cho bài mới — `content` không bao giờ được `undefined`. */
export function emptyBlogDoc(): BlogDoc {
  return { type: "doc", content: [] };
}

export const blogCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "validation.category.nameRequired").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "validation.slug.required")
    .max(120)
    .regex(SLUG_PATTERN, "validation.slug.pattern"),
  description: z.string().trim().max(320),
  // `z.number()` + `valueAsNumber` ở chỗ register, KHÔNG `z.coerce.number()`:
  // coerce làm kiểu VÀO của schema thành `unknown`, và react-hook-form giữ giá
  // trị theo kiểu vào — resolver sẽ không khớp `useForm<BlogCategoryFormValues>`.
  order: z.number("validation.category.orderNumber").int().min(0).max(999),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;

/**
 * Query của bảng `/posts` — parse thẳng từ URL searchParams (nguồn sự thật của
 * filter), nên mọi trường optional và `page`/`limit` phải coerce.
 */
export const adminBlogPostQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  q: z.string().trim().min(1).optional().catch(undefined),
  status: blogPostStatusSchema.optional().catch(undefined),
});

/** `?page=` của trang công khai. `limit` KHÔNG lấy từ URL — xem §4.5. */
export const blogPageParamSchema = z.coerce.number().int().min(1);
