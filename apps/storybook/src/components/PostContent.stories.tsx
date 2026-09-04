import type { Meta, StoryObj } from "@storybook/nextjs";
import { PostContent } from "@noalhub/ui/blog/post-content";
import type {
  BlogBlockNode,
  BlogDoc,
  BlogInlineNode,
  BlogListItemNode,
  BlogMark,
  BlogTextNode,
} from "@noalhub/api/blog";

const meta: Meta<typeof PostContent> = {
  title: "UI/Blog/PostContent",
  component: PostContent,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof PostContent>;

/*
 * Builders rather than literal JSON. A Tiptap document is deeply nested, and
 * hand-written literals bury the ONE node a story is about under four levels of
 * `content:` wrappers. These keep each story readable and still fully typed —
 * a node shape that stops matching `BlogBlockNode` fails `typecheck` here
 * instead of rendering as nothing in the browser.
 */

const text = (value: string, ...marks: BlogMark[]): BlogTextNode =>
  marks.length ? { type: "text", text: value, marks } : { type: "text", text: value };

const p = (...content: BlogInlineNode[]): BlogBlockNode => ({
  type: "paragraph",
  content,
});

const h = (level: 2 | 3, value: string): BlogBlockNode => ({
  type: "heading",
  attrs: { level },
  content: [text(value)],
});

/** A list item holds BLOCKS, not text — which is what lets it nest a list. */
const li = (...content: BlogBlockNode[]): BlogListItemNode => ({
  type: "listItem",
  content,
});

const doc = (...content: BlogBlockNode[]): BlogDoc => ({ type: "doc", content });

/** The only host in `BLOG_IMAGE_HOSTS` that serves real pictures. */
const PHOTO =
  "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=1200&auto=format&fit=crop&q=80";

/**
 * Everything the renderer supports, in one document — the story to open when
 * asking "what does a real post look like?".
 */
export const Default: Story = {
  args: {
    doc: doc(
      h(2, "Hướng dẫn cài đặt và sử dụng Storybook"),
      p(
        text("Storybook là một môi trường phát triển UI "),
        text("độc lập", { type: "bold" }),
        text(
          ", giúp bạn xây dựng, kiểm thử và tài liệu hóa các component một cách trực quan mà không cần khởi động toàn bộ ứng dụng.",
        ),
      ),
      { type: "horizontalRule" },
      h(2, "1. Lợi ích khi sử dụng"),
      {
        type: "bulletList",
        content: [
          li(p(text("Phát triển độc lập (Isolated Development)"))),
          li(p(text("Kiểm thử trực quan (Visual Regression Testing)"))),
          li(p(text("Tài liệu sống, luôn khớp với code"))),
        ],
      },
      h(3, "1.1. Cài đặt"),
      {
        type: "codeBlock",
        attrs: { language: "bash" },
        content: [text("pnpm dlx storybook@latest init\npnpm storybook")],
      },
      {
        type: "blockquote",
        content: [
          p(
            text("Lưu ý: "),
            text("Storybook chạy trên cổng 6006", { type: "code" }),
            text(" theo mặc định."),
          ),
        ],
      },
      {
        type: "image",
        attrs: {
          src: PHOTO,
          alt: "Bàn làm việc của lập trình viên",
          width: 1200,
          height: 800,
        },
      },
      p(
        text("Đọc thêm tại "),
        text("trang chủ Storybook", { type: "link", attrs: { href: "https://storybook.js.org" } }),
        text(" hoặc xem "),
        text("bài viết khác", { type: "link", attrs: { href: "/blog" } }),
        text(" trên blog này."),
      ),
    ),
  },
};

/**
 * `<h1>` belongs to the post title, so a document only ever carries h2 and h3
 * (`BlogHeadingLevel`). Each heading also gets an `id` from `collectHeadings` —
 * the same walk the table of contents uses, so anchors and TOC cannot diverge.
 * Inspect the DOM here to see the de-duplicated ids on the two identical
 * "Cài đặt" headings.
 */
export const Headings: Story = {
  args: {
    doc: doc(
      h(2, "Tiêu đề cấp 2"),
      p(text("Đoạn văn dưới tiêu đề cấp 2.")),
      h(3, "Tiêu đề cấp 3"),
      p(text("Đoạn văn dưới tiêu đề cấp 3.")),
      h(3, "Cài đặt"),
      p(text("Hai tiêu đề trùng tên — id thứ hai phải khác id thứ nhất.")),
      h(3, "Cài đặt"),
      p(text("Đoạn văn cuối.")),
    ),
  },
};

/**
 * Every mark in the allowlist, alone and stacked. Marks wrap from the inside
 * out with `link` applied last, so the combined run renders as
 * `<a><strong><em>…</em></strong></a>`.
 */
export const TextMarks: Story = {
  args: {
    doc: doc(
      h(2, "Các kiểu định dạng chữ"),
      p(text("Chữ thường, "), text("in đậm", { type: "bold" }), text(".")),
      p(text("Chữ thường, "), text("in nghiêng", { type: "italic" }), text(".")),
      p(text("Chữ thường, "), text("gạch ngang", { type: "strike" }), text(".")),
      p(text("Chữ thường, "), text("mã nội dòng", { type: "code" }), text(".")),
      p(
        text("Liên kết ngoài "),
        text("mở tab mới", { type: "link", attrs: { href: "https://storybook.js.org" } }),
        text(" — renderer tự gắn target=\"_blank\" rel=\"nofollow noopener\"."),
      ),
      p(
        text("Liên kết nội bộ "),
        text("giữ nguyên tab", { type: "link", attrs: { href: "/blog/bai-viet" } }),
        text(" vì href bắt đầu bằng /."),
      ),
      p(
        text("Chồng nhiều mark: "),
        text("đậm + nghiêng + link", { type: "bold" }, { type: "italic" }, {
          type: "link",
          attrs: { href: "https://storybook.js.org" },
        }),
        text("."),
      ),
    ),
  },
};

/**
 * A `listItem` contains blocks, so it can hold several paragraphs or a whole
 * nested list — the case that breaks renderers written for flat lists.
 */
export const Lists: Story = {
  args: {
    doc: doc(
      h(2, "Danh sách không thứ tự"),
      {
        type: "bulletList",
        content: [
          li(p(text("Mục thứ nhất"))),
          li(
            p(text("Mục thứ hai, có danh sách con:")),
            {
              type: "bulletList",
              content: [li(p(text("Mục con A"))), li(p(text("Mục con B")))],
            },
          ),
          li(
            p(text("Mục thứ ba, gồm hai đoạn văn.")),
            p(text("Đoạn văn thứ hai nằm trong cùng một mục.")),
          ),
        ],
      },
      h(2, "Danh sách có thứ tự"),
      {
        type: "orderedList",
        content: [
          li(p(text("Bước một"))),
          li(
            p(text("Bước hai, có các bước nhỏ:")),
            {
              type: "orderedList",
              content: [li(p(text("Bước 2.1"))), li(p(text("Bước 2.2")))],
            },
          ),
          li(p(text("Bước ba, kèm "), text("chữ in đậm", { type: "bold" }))),
        ],
      },
    ),
  },
};

/** A blockquote also holds blocks — headings, lists and rules included. */
export const Blockquote: Story = {
  args: {
    doc: doc(
      h(2, "Trích dẫn"),
      {
        type: "blockquote",
        content: [p(text("Một trích dẫn ngắn, chỉ có một đoạn văn."))],
      },
      {
        type: "blockquote",
        content: [
          h(3, "Trích dẫn có tiêu đề"),
          p(text("Đoạn văn thứ nhất trong trích dẫn.")),
          {
            type: "bulletList",
            content: [li(p(text("Kèm cả danh sách"))), li(p(text("Nhiều mục")))],
          },
          p(text("Đoạn kết, có "), text("mã nội dòng", { type: "code" }), text(".")),
        ],
      },
    ),
  },
};

/**
 * `language` only becomes a `language-*` class: this pass does NOT highlight.
 * The `null` case is a block pasted without a language chosen.
 */
export const CodeBlocks: Story = {
  args: {
    doc: doc(
      h(2, "Khối mã"),
      p(text("Có khai báo ngôn ngữ:")),
      {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [
          text(
            'export function greet(name: string) {\n  return `Xin chào, ${name}!`;\n}\n\ngreet("Storybook");',
          ),
        ],
      },
      p(text("Không khai báo ngôn ngữ:")),
      {
        type: "codeBlock",
        attrs: { language: null },
        content: [text("$ pnpm install\n$ pnpm dev")],
      },
      p(text("Khối mã rỗng:")),
      { type: "codeBlock", attrs: { language: null } },
      p(text("Dòng rất dài, để kiểm tra thanh cuộn ngang:")),
      {
        type: "codeBlock",
        attrs: { language: "json" },
        content: [
          text(
            '{ "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "một dòng cố tình dài hơn khung nội dung để thấy overflow" }] }] }',
          ),
        ],
      },
    ),
  },
};

/**
 * Measured vs unmeasured. With `width`/`height` the image gets its exact box;
 * with `null` (the editor could not measure — dead image, CORS) it falls back
 * to an `aspect-video` frame with `object-contain`, so there is no layout shift
 * either way.
 */
export const Images: Story = {
  args: {
    doc: doc(
      h(2, "Ảnh có kích thước thật"),
      {
        type: "image",
        attrs: { src: PHOTO, alt: "Bàn làm việc của lập trình viên", width: 1200, height: 800 },
      },
      h(2, "Ảnh không đo được kích thước"),
      p(text("Khung aspect-video + object-contain, ảnh không bị méo.")),
      {
        type: "image",
        attrs: { src: PHOTO, alt: "Cùng tấm ảnh, không có width/height", width: null, height: null },
      },
      h(2, "Ảnh trang trí"),
      p(text("alt rỗng là hợp lệ — trình đọc màn hình bỏ qua ảnh này.")),
      { type: "image", attrs: { src: PHOTO, alt: "", width: 1200, height: 800 } },
    ),
  },
};

/**
 * The whitespace nodes. `hardBreak` is a soft return inside one paragraph
 * (an address, a verse); an EMPTY paragraph is how an author asks for a pause,
 * and the renderer keeps its line height with a `<br>` rather than collapsing
 * the block away.
 */
export const BreaksAndSpacing: Story = {
  args: {
    doc: doc(
      h(2, "Xuống dòng và khoảng trắng"),
      p(
        text("Dòng thứ nhất"),
        { type: "hardBreak" },
        text("Dòng thứ hai, cùng một đoạn văn"),
        { type: "hardBreak" },
        text("Dòng thứ ba"),
      ),
      { type: "paragraph" },
      p(text("Phía trên là một đoạn văn rỗng — nó vẫn chiếm chỗ.")),
      { type: "horizontalRule" },
      p(text("Phía trên là horizontalRule.")),
    ),
  },
};

/**
 * The failure modes, which are the whole point of the renderer's design: a bad
 * document must degrade, never blank the page.
 *
 * The doc is cast because these shapes are deliberately INVALID — an unknown
 * node type does not exist in `BlogBlockNode`, which is exactly what makes it
 * worth a story. `sanitizeBlogDoc` would strip most of this on the way in; the
 * renderer is the second line of defence for documents arriving from a cache or
 * from editor state that skipped it.
 */
export const Degradation: Story = {
  args: {
    doc: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Nội dung hỏng" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Link nguy hiểm " },
            {
              type: "text",
              text: "vẫn giữ được chữ",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
            { type: "text", text: " nhưng không sinh ra thẻ <a>." },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Ảnh dưới đây có host ngoài allowlist nên bị bỏ hẳn:" }],
        },
        {
          type: "image",
          attrs: { src: "https://evil.example.com/x.png", alt: "Không bao giờ hiển thị", width: 800, height: 600 },
        },
        // An unknown block: dropped in silence, and the paragraphs around it survive.
        { type: "customEmbed", attrs: { id: "42" } },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Đoạn văn này vẫn hiển thị bình thường." }],
        },
        // An unknown MARK on a valid text node: the mark is ignored, the text stays.
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Chữ này mang một mark lạ", marks: [{ type: "highlight" }] },
          ],
        },
      ],
    } as unknown as BlogDoc,
  },
};

/** Nothing to render: the wrapper still exists, and nothing throws. */
export const Empty: Story = {
  args: { doc: doc() },
};
