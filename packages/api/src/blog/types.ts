/**
 * A mirror of the blog contract in `docs/blog.md` §2.
 *
 * The backend has implemented this contract (repo `noalhub-be`,
 * `docs/blog.md`), so `/docs-json` is the source of truth. When this file and
 * the spec disagree, fix this file FIRST and the call sites after — it is the
 * only description of the shape on the frontend.
 *
 * Two deliberate asymmetries, copied from §2.3 so nobody has to open the doc:
 *
 * - **Reads receive `category`/`tags` expanded to `{ slug, name }`, writes send
 *   `categoryId`/`tagIds`.** The frontend never has to look up a table to
 *   display, and the backend never has to guess intent from a name string.
 * - **A list item is NOT a trimmed `BlogPost`** but its own DTO
 *   (`BlogPostListItem`): no `content` or `contentText`, so a list of 20 posts
 *   does not weigh hundreds of KB, and in exchange it carries the backend's
 *   `readingMinutes`.
 */

/**
 * `<h1>` is the post title (§6.2), so content may only use h2/h3. This is a
 * constraint on the attribute's **value**, distinct from allowing the `heading`
 * node at all (§3.1a).
 */
export type BlogHeadingLevel = 2 | 3;

/** The marks allowed on `text` — allowlist §3.1, no others exist. */
export type BlogMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "strike" }
  | { type: "code" }
  /**
   * An `href` that already passed the scheme allowlist (§3.1a). `target`/`rel`
   * are NOT here: the renderer sets them, data does not get to decide.
   */
  | { type: "link"; attrs: { href: string } };

export type BlogTextNode = {
  type: "text";
  text: string;
  marks?: BlogMark[];
};

export type BlogHardBreakNode = { type: "hardBreak" };

export type BlogInlineNode = BlogTextNode | BlogHardBreakNode;

export type BlogParagraphNode = {
  type: "paragraph";
  content?: BlogInlineNode[];
};

export type BlogHeadingNode = {
  type: "heading";
  attrs: { level: BlogHeadingLevel };
  content?: BlogInlineNode[];
};

/** `language` from the fixed allowlist (§3.1c). The renderer does NOT highlight in this pass. */
export type BlogCodeBlockNode = {
  type: "codeBlock";
  attrs: { language: string | null };
  content?: BlogTextNode[];
};

/**
 * `width`/`height` are here **from day one** (§3.1b): adding them later would
 * mean a `jsonb` migration across every post ever written. `null` means the
 * editor could not measure (dead image, CORS) → the renderer falls back to an
 * `aspect-video` frame.
 */
export type BlogImageNode = {
  type: "image";
  attrs: {
    src: string;
    /** May be empty (a decorative image), but never `null` (§3.1a). */
    alt: string;
    width: number | null;
    height: number | null;
  };
};

export type BlogHorizontalRuleNode = { type: "horizontalRule" };

export type BlogListItemNode = { type: "listItem"; content: BlogBlockNode[] };

export type BlogBulletListNode = {
  type: "bulletList";
  content: BlogListItemNode[];
};

export type BlogOrderedListNode = {
  type: "orderedList";
  content: BlogListItemNode[];
};

export type BlogBlockquoteNode = {
  type: "blockquote";
  content: BlogBlockNode[];
};

export type BlogBlockNode =
  | BlogParagraphNode
  | BlogHeadingNode
  | BlogCodeBlockNode
  | BlogImageNode
  | BlogHorizontalRuleNode
  | BlogBulletListNode
  | BlogOrderedListNode
  | BlogBlockquoteNode;

/** A Tiptap/ProseMirror document — a `jsonb` column on the backend (§3). */
export type BlogDoc = { type: "doc"; content: BlogBlockNode[] };

/**
 * The two taxonomy axes (§2.6) share a shape but NOT a meaning: categories are
 * a fixed, admin-managed set that gets indexed; tags grow with the posts and
 * are `noindex`. Read `docs/blog.md` §2.6 before merging these two types.
 */
export type BlogTaxonomyRef = { slug: string; name: string };

export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  /** The blurb at the top of a category page — what keeps it from being a thin page (§6.5). */
  description: string | null;
  /** The display order in the public nav (§6.1). */
  order: number;
  /**
   * The public `/blog/categories` counts only `published` posts;
   * `/admin/blog/categories` counts drafts too. Same field name, two numbers.
   */
  postCount: number;
};

export type BlogTag = {
  id: string;
  slug: string;
  name: string;
  postCount: number;
};

export type BlogPostStatus = "draft" | "published" | "archived";

export type BlogAuthor = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type BlogPostSeo = {
  /** `null` → falls back to `title` (§6.2). */
  metaTitle: string | null;
  metaDescription: string | null;
  /** Set only when the post is republished from another source. */
  canonicalUrl: string | null;
  /** `null` → falls back to `coverImageUrl` → the default OG image. */
  ogImageUrl: string | null;
  noindex: boolean;
};

/** `BlogPostDto` (§2.3) — the full record, needed only by the post page and the editor. */
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  /** The summary shown in listings. DIFFERENT from `seo.metaDescription`. */
  excerpt: string | null;
  content: BlogDoc;
  /**
   * Plain text generated from `content` by the **backend** (§2.3). Generated on
   * the frontend it would differ per app and be unqueryable in the DB. Used for
   * reading time on the post page.
   */
  contentText: string;
  coverImageUrl: string | null;
  /** `null` is valid ONLY while `status = "draft"` (§2.6). */
  category: BlogTaxonomyRef | null;
  /**
   * ⚠️ A **set**, not an ordered list — the contract makes no promise that the
   * element order means anything. Do not write code that relies on `tags[0]`
   * (§2.6).
   */
  tags: BlogTaxonomyRef[];
  status: BlogPostStatus;
  /** `null` until it has been published at least once. */
  publishedAt: string | null;
  updatedAt: string;
  /** Optimistic locking — sent back on `PATCH`; a mismatch is a 409 (§7.3). */
  version: number;
  author: BlogAuthor;
  seo: BlogPostSeo;
};

/**
 * `BlogPostListItemDto` (§2.3a) — its **own** DTO, not a trimmed `BlogPost`.
 * The important difference is `readingMinutes`: listings carry neither
 * `content` nor `contentText`, so the frontend has nothing to compute from.
 */
export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  /** NOT nullable in listings — the backend generates it from `contentText` (§2.3b). */
  excerpt: string;
  coverImageUrl: string | null;
  /** NOT nullable: listings only contain published posts, and publishing requires a category. */
  category: BlogTaxonomyRef;
  tags: BlogTaxonomyRef[];
  publishedAt: string;
  updatedAt: string;
  author: BlogAuthor;
  /** Computed by the BACKEND (§2.3a). Drop this field and listings lose reading time. */
  readingMinutes: number;
};

/**
 * The offset pagination envelope — **the same shape as `AdminUserList`**,
 * deliberately not a second type (§2.1a). `total` is not decoration: §4.5 needs
 * it to `notFound()` when `?page` runs past the last page.
 */
export type BlogPostList = {
  items: BlogPostListItem[];
  total: number;
  page: number;
  limit: number;
};

/**
 * The query for `GET /blog/posts`. `category` and `tag` take **slugs** (not
 * ids) and are independent filters — sent together they AND.
 */
export type BlogPostQuery = {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
};

/** `GET /blog/sitemap-entries` — unpaginated, no limit (§2.1). */
export type BlogSitemapEntry = {
  slug: string;
  updatedAt: string;
};

/** The admin table's query. Sorted `updatedAt DESC`, UNLIKE the public list (§2.1a). */
export type AdminBlogPostQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: BlogPostStatus;
};

/** `GET /admin/blog/posts` — the same envelope, but the items are full records. */
export type AdminBlogPostList = {
  items: BlogPost[];
  total: number;
  page: number;
  limit: number;
};
