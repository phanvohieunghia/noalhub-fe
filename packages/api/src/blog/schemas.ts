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
 * Allowlist — the frontend half of the trust boundary (§3, §3.1, §3.1a)
 * ------------------------------------------------------------------------- */

/**
 * The allowed nodes and marks (§3.1). This list must MATCH the editor's schema
 * (`apps/admin`), the backend's write validation, and the renderer
 * (`packages/ui/src/blog/post-content.tsx`). Drift in one place means data that
 * can be written but not displayed, or the other way round.
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

/** `<h1>` is the post title (§6.2) — content only has h2/h3. */
export const BLOG_HEADING_LEVELS = [2, 3] as const;

/**
 * Languages for `codeBlock` (§3.1c). This pass only STORES them, no
 * highlighting yet — but the list has to be settled now because `language` is a
 * schema attribute, and adding to it later means a `jsonb` migration. The same
 * list lives in the editor, the backend and the renderer.
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
 * The safe schemes for `link.href` (§3.1a).
 *
 * ⚠️ Checked with `new URL()` and a `protocol` comparison, **never** a regex on
 * the raw string: `java\tscript:` slips past a regex and browsers still run it.
 * This is exactly the stored XSS §3 claims to have closed — without this
 * function that claim is false.
 */
const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

/**
 * The allowed hosts for `image.src` (§3.1a).
 *
 * Re-exported from `@noalhub/config/blog-image-hosts.mjs`, the same file both
 * apps' `images.remotePatterns` read. The list used to be hand-copied in three
 * places and really did drift; this re-export keeps consumers importing from
 * `@noalhub/api/blog` as before, without needing to know the config package.
 */
export { BLOG_IMAGE_DEV_HOSTS, BLOG_IMAGE_HOSTS };

/** Three static segments living beside `/blogs/[slug]` — a post whose slug collides cannot be opened (§4.5). */
export const RESERVED_POST_SLUGS = ["category", "tag", "rss.xml"] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `href` may only be `http:`/`https:`/`mailto:` — see `SAFE_LINK_PROTOCOLS`. */
export function isSafeLinkHref(href: unknown): href is string {
  if (typeof href !== "string" || href.length === 0) return false;
  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(href).protocol);
  } catch {
    // A relative URL (`/gioi-thieu`) cannot be parsed without a base. Posts
    // linking internally is routine, so it is allowed — but only in the `/…`
    // form, so `javascript:…` cannot slip through this door.
    return href.startsWith("/") && !href.startsWith("//");
  }
}

/**
 * `src` must be `https:` with a host in `BLOG_IMAGE_HOSTS`, or — outside
 * production only — `http:` with a host in `BLOG_IMAGE_DEV_HOSTS`
 * (`localhost`).
 *
 * The `http:` exception is deliberately NOT its own flag: it is welded to the
 * dev host list, which is empty when `NODE_ENV=production`. That means the
 * second branch cannot be true in production whatever the src is, and the
 * "public images are always https" constraint stays intact.
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
 * Document sanitization (§3.1, §3.1a)
 * ------------------------------------------------------------------------- */

/**
 * Normalizes a Tiptap document down to the allowlist: valid nodes, marks and
 * attributes are kept, everything else is **dropped silently**.
 *
 * Why sanitize instead of a strict `z.object(...)`: §3.1 requires "an unknown
 * node → the renderer ignores it silently; one unknown node must not blank the
 * page". A strict schema does exactly the opposite — the next Tiptap release
 * adds an attribute, `parse` throws, and the post page 500s. Lenient
 * sanitization here and strictness at the outer layer (`blogPostSchema`) is the
 * right split.
 *
 * The function is used in BOTH directions: reading (server.ts + api.ts) and
 * writing (what the editor sends). So what sits in the DB and what gets
 * rendered are always the same set.
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
      // A level outside [2,3] falls back to h2 rather than dropping the whole
      // heading: losing a TOC entry beats losing the section under it.
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
        // Inside a codeBlock, text carries no marks.
        content: sanitizeInline(raw.content).filter(isTextNode),
      };
    }

    case "horizontalRule":
      return { type: "horizontalRule" };

    case "image": {
      // A src outside the allowlist → drop the image entirely (there is no child text to keep).
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
      // An unknown node (an extension from a later Tiptap) — dropped silently, never thrown on (§3.1).
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
      // A dirty href → drop the MARK but keep the text (§3.1a): a bad link
      // degrades to plain words. `target`/`rel` are deliberately not read from
      // data — the renderer sets them.
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

/** `content` goes through the sanitizer above, not `z.object` — see §3.1. */
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
 * `page`/`limit` use `.catch()` rather than being required — same reason as
 * `adminUserListSchema`: without the two echoed numbers, pagination can still
 * be built from the query we sent, and it is not worth breaking the page.
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

export const blogPostSlugSchema = z.object({
  id: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  post: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    status: blogPostStatusSchema,
  }),
});

export const adminBlogSlugListSchema = z.object({
  items: z.array(blogPostSlugSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const blogSitemapEntrySchema = z.object({
  slug: z.string(),
  updatedAt: z.string(),
});

export const blogSitemapEntryListSchema = z.array(blogSitemapEntrySchema);

/* ------------------------------------------------------------------------- *
 * Input schemas — the forms in apps/admin
 * ------------------------------------------------------------------------- */

/**
 * ⚠️ The min/max constraints here must MATCH the backend DTO
 * (`docs/data-layer.md` §5). Checked against
 * `src/admin/dto/blog-write.dto.ts` in the `noalhub-be` repo: title 200, slug
 * 120, excerpt 500, metaTitle 120, metaDescription 320, URL 2048, at most 20
 * tags. Change one side and forget the other and the form accepts the input
 * before the backend answers `VALIDATION_FAILED` — the user sees an error where
 * no field looks wrong.
 */
export const blogSlugSchema = z
  .string()
  .trim()
  .min(1, "validation.slug.required")
  .max(120, "validation.slug.tooLong")
  .regex(SLUG_PATTERN, "validation.slug.pattern")
  .refine(
    (slug) => !(RESERVED_POST_SLUGS as readonly string[]).includes(slug),
    // Not a cosmetic rule: these three strings are static segments under
    // `/blogs`, and Next always lets a static segment beat a dynamic one, so the
    // post would never open.
    { message: "validation.slug.reserved" },
  );

/**
 * The form's URL field: **stays a `string`**, with no `.transform()` to `null`.
 *
 * A transform here would make the schema's input and output types differ, and
 * react-hook-form holds values in the INPUT type — `value={null}` makes the
 * input uncontrolled and React complains. Turning `""` into `null` for the wire
 * is `toBlogPostPayload`'s job below, in exactly one place.
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
 * The editor's form — **flat**, including the `seo` group that is nested in the
 * DTO.
 *
 * Flat because the form belongs to react-hook-form and the SEO panel, while the
 * nested shape belongs to the contract; `toBlogPostPayload` joins the two.
 * Mixing both shapes into one type is where "change the DTO and the form breaks
 * silently" bugs come from.
 *
 * `categorySlug` may be empty: **saving a draft does not require a category**.
 * The "required to publish" constraint lives in the Publish button's checklist,
 * not here — requiring it at creation time would force a decision nobody has
 * made yet every time `/posts/new` opens (§2.6, §7.4).
 */
export const blogPostFormSchema = z.object({
  title: z.string().trim().min(1, "validation.post.titleRequired").max(200),
  slug: blogSlugSchema,
  excerpt: z.string().trim().max(500),
  // Content is not validated node by node here — `sanitizeBlogDoc` does that
  // when the payload is built, and it FILTERS rather than rejects (§3.1).
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
 * DTO → form values. `null` becomes `""` because inputs cannot hold `null`.
 *
 * ⚠️ The form holds category/tag **slugs**, not ids — because `BlogPostDto`
 * only returns the expanded `{ slug, name }`, never ids (§2.3). That asymmetry
 * is deliberate on the read side, but it hands the write side one job: convert
 * slugs back to ids while building the payload (`toBlogPostPayload`), looking
 * them up in the very lists the editor already loaded for the select and the
 * tag field. No extra endpoint is needed.
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
 * Form values → the wire payload.
 *
 * Four jobs, all done only here: turn `""` into `null`, regroup the `seo`
 * fields, convert category/tag slugs back to **ids**, and **sanitize `content`
 * once more before writing** — so that what lands in the DB is already within
 * the §3.1/§3.1a allowlist, regardless of whether the editor sent it correctly.
 *
 * ⚠️ Call this only once both taxonomy lists have loaded. A slug that resolves
 * to no id is dropped, so calling it with empty lists (queries still loading or
 * just failed) **silently strips every tag and the category from the post**.
 * That is why the editor disables Save until both queries have data — a real
 * constraint, not a decorative detail.
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

/** The empty doc for a new post — `content` must never be `undefined`. */
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
  // `z.number()` plus `valueAsNumber` at the register call, NOT
  // `z.coerce.number()`: coercion makes the schema's INPUT type `unknown`, and
  // react-hook-form holds values in the input type — the resolver would then
  // not match `useForm<BlogCategoryFormValues>`.
  order: z.number("validation.category.orderNumber").int().min(0).max(999),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;

/**
 * The `/posts` table's query — parsed straight from the URL searchParams (the
 * source of truth for filters), so every field is optional and `page`/`limit`
 * must be coerced.
 */
export const adminBlogPostQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  q: z.string().trim().min(1).optional().catch(undefined),
  status: blogPostStatusSchema.optional().catch(undefined),
});

/**
 * `/posts/slugs` reads its filters from the URL, so every field `.catch()`es back
 * to a default: people edit the address bar, and `?page=abc` must not blank the
 * screen. `docs/slug-management.md` §3.
 */
export const adminBlogSlugQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(50).catch(10),
  q: z.string().trim().min(1).optional().catch(undefined),
  postId: z.string().trim().min(1).optional().catch(undefined),
  sort: z.enum(["created", "slug"]).catch("created"),
  order: z.enum(["asc", "desc"]).catch("desc"),
});

/** The public pages' `?page=`. `limit` is NOT taken from the URL — see §4.5. */
export const blogPageParamSchema = z.coerce.number().int().min(1);
