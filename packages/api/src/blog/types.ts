/**
 * Mirror của contract blog ở `docs/blog-plan.md` §2.
 *
 * Backend đã implement contract này (repo `noalhub-be`, `docs/blog.md`), nên
 * `/docs-json` là nguồn sự thật. Lệch giữa file này và spec thì sửa file này
 * TRƯỚC rồi mới sửa chỗ gọi — nó là nơi duy nhất mô tả shape ở phía frontend.
 *
 * Hai bất đối xứng cố ý, chép lại từ §2.3 để khỏi phải mở plan:
 *
 * - **Đọc nhận `category`/`tags` đã nở `{ slug, name }`, ghi gửi `categoryId`/
 *   `tagIds`.** FE không phải tra bảng để hiển thị, backend không phải đoán ý
 *   từ một chuỗi tên.
 * - **List item KHÔNG phải `BlogPost` bị cắt bớt** mà là DTO riêng
 *   (`BlogPostListItem`): không có `content`/`contentText` để list 20 bài không
 *   nặng vài trăm KB, và bù lại có `readingMinutes` do backend tính.
 */

/**
 * `<h1>` là tiêu đề bài (§6.2), nên nội dung chỉ được dùng h2/h3. Đây là ràng
 * buộc **giá trị** của attr, khác với việc cho phép node `heading` (§3.1a).
 */
export type BlogHeadingLevel = 2 | 3;

/** Mark cho phép trong `text` — allowlist §3.1, không có mark nào khác. */
export type BlogMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "strike" }
  | { type: "code" }
  /**
   * `href` đã qua allowlist scheme (§3.1a). `target`/`rel` KHÔNG nằm ở đây:
   * renderer tự đặt, dữ liệu không được quyết định chúng.
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

/** `language` trong allowlist cố định (§3.1c). Đợt này renderer KHÔNG tô màu. */
export type BlogCodeBlockNode = {
  type: "codeBlock";
  attrs: { language: string | null };
  content?: BlogTextNode[];
};

/**
 * `width`/`height` có mặt **ngay từ đợt 1** (§3.1b): thêm sau là phải migrate
 * `jsonb` của mọi bài đã viết. `null` = editor không đo được (ảnh chết, CORS) →
 * renderer rơi về khung `aspect-video`.
 */
export type BlogImageNode = {
  type: "image";
  attrs: {
    src: string;
    /** Cho phép rỗng (ảnh trang trí), KHÔNG cho `null` (§3.1a). */
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

/** Document Tiptap/ProseMirror — cột `jsonb` ở backend (§3). */
export type BlogDoc = { type: "doc"; content: BlogBlockNode[] };

/**
 * Hai trục phân loại (§2.6) dùng chung một shape, nhưng KHÔNG dùng chung ngữ
 * nghĩa: chuyên mục là tập cố định do admin quản lý và được index; thẻ mọc theo
 * bài và `noindex`. Xem `docs/blog-plan.md` §2.6 trước khi gộp hai kiểu này.
 */
export type BlogTaxonomyRef = { slug: string; name: string };

export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  /** Mô tả đầu trang chuyên mục — thứ làm nó KHÔNG phải trang mỏng (§6.5). */
  description: string | null;
  /** Thứ tự hiện ở nav công khai (§6.1). */
  order: number;
  /**
   * `/blog/categories` công khai chỉ đếm bài `published`;
   * `/admin/blog/categories` đếm cả nháp. Cùng tên trường, hai con số.
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
  /** `null` → fallback về `title` (§6.2). */
  metaTitle: string | null;
  metaDescription: string | null;
  /** Chỉ set khi bài đăng lại từ nguồn khác. */
  canonicalUrl: string | null;
  /** `null` → fallback `coverImageUrl` → OG mặc định. */
  ogImageUrl: string | null;
  noindex: boolean;
};

/** `BlogPostDto` (§2.3) — bản đầy đủ, chỉ trang bài viết và editor cần. */
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  /** Tóm tắt hiển thị ở list. KHÁC `seo.metaDescription`. */
  excerpt: string | null;
  content: BlogDoc;
  /**
   * Plain text do **backend** sinh từ `content` (§2.3). Sinh ở FE thì mỗi app
   * một kiểu và không query được ở DB. Dùng cho reading time ở trang bài viết.
   */
  contentText: string;
  coverImageUrl: string | null;
  /** `null` CHỈ hợp lệ khi `status = "draft"` (§2.6). */
  category: BlogTaxonomyRef | null;
  /**
   * ⚠️ Là **tập**, không phải danh sách có thứ tự — contract không cam kết thứ
   * tự phần tử có nghĩa. Đừng viết code dựa vào `tags[0]` (§2.6).
   */
  tags: BlogTaxonomyRef[];
  status: BlogPostStatus;
  /** `null` khi chưa từng publish. */
  publishedAt: string | null;
  updatedAt: string;
  /** Optimistic locking — gửi lại khi `PATCH`, lệch thì 409 (§7.3). */
  version: number;
  author: BlogAuthor;
  seo: BlogPostSeo;
};

/**
 * `BlogPostListItemDto` (§2.3a) — DTO **riêng**, không phải `BlogPost` bị cắt.
 * Khác biệt quan trọng nhất là `readingMinutes`: list không có `content` lẫn
 * `contentText` nên FE không có gì để tự tính.
 */
export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  /** KHÔNG nullable ở list — backend tự sinh từ `contentText` (§2.3b). */
  excerpt: string;
  coverImageUrl: string | null;
  /** KHÔNG nullable: list chỉ có bài published, mà publish bắt buộc có mục. */
  category: BlogTaxonomyRef;
  tags: BlogTaxonomyRef[];
  publishedAt: string;
  updatedAt: string;
  author: BlogAuthor;
  /** BACKEND tính (§2.3a). Bỏ trường này = bỏ reading time khỏi danh sách. */
  readingMinutes: number;
};

/**
 * Envelope phân trang offset — **cùng shape với `AdminUserList`**, cố ý không
 * đẻ ra kiểu thứ hai (§2.1a). `total` không phải để trang trí: §4.5 cần nó mới
 * `notFound()` được khi `?page` vượt tổng số trang.
 */
export type BlogPostList = {
  items: BlogPostListItem[];
  total: number;
  page: number;
  limit: number;
};

/**
 * Query của `GET /blog/posts`. `category` và `tag` nhận **slug** (không phải
 * id) và là hai bộ lọc độc lập — cùng gửi thì AND.
 */
export type BlogPostQuery = {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
};

/** `GET /blog/sitemap-entries` — không phân trang, không limit (§2.1). */
export type BlogSitemapEntry = {
  slug: string;
  updatedAt: string;
};

/** Query của bảng quản trị. Sort `updatedAt DESC`, KHÁC public (§2.1a). */
export type AdminBlogPostQuery = {
  page?: number;
  limit?: number;
  q?: string;
  status?: BlogPostStatus;
};

/** `GET /admin/blog/posts` — cùng envelope, nhưng item là bản đầy đủ. */
export type AdminBlogPostList = {
  items: BlogPost[];
  total: number;
  page: number;
  limit: number;
};
