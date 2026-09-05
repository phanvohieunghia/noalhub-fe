import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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
  render: function DefaultStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("introTitle")),
      p(
        text(t("introLead1")),
        text(t("introLeadBold"), { type: "bold" }),
        text(t("introLead2"),
        ),
      ),
      { type: "horizontalRule" },
      h(2, t("benefitsTitle")),
      {
        type: "bulletList",
        content: [
          li(p(text(t("benefit1")))),
          li(p(text(t("benefit2")))),
          li(p(text(t("benefit3")))),
        ],
      },
      h(3, t("installTitle")),
      {
        type: "codeBlock",
        attrs: { language: "bash" },
        content: [text("pnpm dlx storybook@latest init\npnpm storybook")],
      },
      {
        type: "blockquote",
        content: [
          p(
            text(t("noteLabel")),
            text(t("noteCode"), { type: "code" }),
            text(t("noteTail")),
          ),
        ],
      },
      {
        type: "image",
        attrs: {
          src: PHOTO,
          alt: t("photoAlt"),
          width: 1200,
          height: 800,
        },
      },
      p(
        text(t("readMore")),
        text(t("readMoreLink"), { type: "link", attrs: { href: "https://storybook.js.org" } }),
        text(t("readMoreOr")),
        text(t("readMoreOther"), { type: "link", attrs: { href: "/blog" } }),
        text(t("readMoreTail")),
      ),
    )} />;
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
  render: function HeadingsStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("h2")),
      p(text(t("h2Body"))),
      h(3, t("h3")),
      p(text(t("h3Body"))),
      h(3, t("install")),
      p(text(t("dupHeading"))),
      h(3, t("install")),
      p(text(t("lastPara"))),
    )} />;
  },
};

/**
 * Every mark in the allowlist, alone and stacked. Marks wrap from the inside
 * out with `link` applied last, so the combined run renders as
 * `<a><strong><em>…</em></strong></a>`.
 */
export const TextMarks: Story = {
  render: function TextMarksStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("marksTitle")),
      p(text(t("plain")), text(t("bold"), { type: "bold" }), text(t("dot"))),
      p(text(t("plain")), text(t("italic"), { type: "italic" }), text(t("dot"))),
      p(text(t("plain")), text(t("strike"), { type: "strike" }), text(t("dot"))),
      p(text(t("plain")), text(t("code"), { type: "code" }), text(t("dot"))),
      p(
        text(t("extLink")),
        text(t("extLinkText"), { type: "link", attrs: { href: "https://storybook.js.org" } }),
        text(t("extLinkTail")),
      ),
      p(
        text(t("intLink")),
        text(t("intLinkText"), { type: "link", attrs: { href: "/blog/bai-viet" } }),
        text(t("intLinkTail")),
      ),
      p(
        text(t("stacked")),
        text(t("stackedText"), { type: "bold" }, { type: "italic" }, {
          type: "link",
          attrs: { href: "https://storybook.js.org" },
        }),
        text(t("dot")),
      ),
    )} />;
  },
};

/**
 * A `listItem` contains blocks, so it can hold several paragraphs or a whole
 * nested list — the case that breaks renderers written for flat lists.
 */
export const Lists: Story = {
  render: function ListsStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("bulletTitle")),
      {
        type: "bulletList",
        content: [
          li(p(text(t("item1")))),
          li(
            p(text(t("item2"))),
            {
              type: "bulletList",
              content: [li(p(text(t("subA")))), li(p(text(t("subB"))))],
            },
          ),
          li(
            p(text(t("item3"))),
            p(text(t("item3b"))),
          ),
        ],
      },
      h(2, t("orderedTitle")),
      {
        type: "orderedList",
        content: [
          li(p(text(t("step1")))),
          li(
            p(text(t("step2"))),
            {
              type: "orderedList",
              content: [li(p(text(t("step21")))), li(p(text(t("step22"))))],
            },
          ),
          li(p(text(t("step3")), text(t("boldText"), { type: "bold" }))),
        ],
      },
    )} />;
  },
};

/** A blockquote also holds blocks — headings, lists and rules included. */
export const Blockquote: Story = {
  render: function BlockquoteStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("quoteTitle")),
      {
        type: "blockquote",
        content: [p(text(t("quoteShort")))],
      },
      {
        type: "blockquote",
        content: [
          h(3, t("quoteTitled")),
          p(text(t("quoteP1"))),
          {
            type: "bulletList",
            content: [li(p(text(t("quoteList")))), li(p(text(t("quoteListItem"))))],
          },
          p(text(t("quoteEnd")), text(t("code"), { type: "code" }), text(t("dot"))),
        ],
      },
    )} />;
  },
};

/**
 * `language` only becomes a `language-*` class: this pass does NOT highlight.
 * The `null` case is a block pasted without a language chosen.
 */
export const CodeBlocks: Story = {
  render: function CodeBlocksStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("codeTitle")),
      p(text(t("codeWithLang"))),
      {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [
          text(
            'export function greet(name: string) {\n  return `Xin chào, ${name}!`;\n}\n\ngreet("Storybook");',
          ),
        ],
      },
      p(text(t("codeNoLang"))),
      {
        type: "codeBlock",
        attrs: { language: null },
        content: [text("$ pnpm install\n$ pnpm dev")],
      },
      p(text(t("codeEmpty"))),
      { type: "codeBlock", attrs: { language: null } },
      p(text(t("codeLong"))),
      {
        type: "codeBlock",
        attrs: { language: "json" },
        content: [
          text(
            '{ "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "một dòng cố tình dài hơn khung nội dung để thấy overflow" }] }] }',
          ),
        ],
      },
    )} />;
  },
};

/**
 * Measured vs unmeasured. With `width`/`height` the image gets its exact box;
 * with `null` (the editor could not measure — dead image, CORS) it falls back
 * to an `aspect-video` frame with `object-contain`, so there is no layout shift
 * either way.
 */
export const Images: Story = {
  render: function ImagesStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("imgSized")),
      {
        type: "image",
        attrs: { src: PHOTO, alt: t("photoAlt"), width: 1200, height: 800 },
      },
      h(2, t("imgUnsized")),
      p(text(t("imgUnsizedNote"))),
      {
        type: "image",
        attrs: { src: PHOTO, alt: t("imgSame"), width: null, height: null },
      },
      h(2, t("imgDecor")),
      p(text(t("imgDecorNote"))),
      { type: "image", attrs: { src: PHOTO, alt: "", width: 1200, height: 800 } },
    )} />;
  },
};

/**
 * The whitespace nodes. `hardBreak` is a soft return inside one paragraph
 * (an address, a verse); an EMPTY paragraph is how an author asks for a pause,
 * and the renderer keeps its line height with a `<br>` rather than collapsing
 * the block away.
 */
export const BreaksAndSpacing: Story = {
  render: function BreaksAndSpacingStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={doc(
      h(2, t("breaksTitle")),
      p(
        text(t("line1")),
        { type: "hardBreak" },
        text(t("line2")),
        { type: "hardBreak" },
        text(t("line3")),
      ),
      { type: "paragraph" },
      p(text(t("emptyPara"))),
      { type: "horizontalRule" },
      p(text(t("afterRule"))),
    )} />;
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
  render: function DegradationStory() {
    const t = useTranslations("sb.post");

    return <PostContent doc={{
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t("brokenTitle") }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: t("dangerLink") },
            {
              type: "text",
              text: t("dangerLinkText"),
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
            { type: "text", text: t("dangerLinkTail") },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: t("imgBlocked") }],
        },
        {
          type: "image",
          attrs: { src: "https://evil.example.com/x.png", alt: t("neverShown"), width: 800, height: 600 },
        },
        // An unknown block: dropped in silence, and the paragraphs around it survive.
        { type: "customEmbed", attrs: { id: "42" } },
        {
          type: "paragraph",
          content: [{ type: "text", text: t("stillFine") }],
        },
        // An unknown MARK on a valid text node: the mark is ignored, the text stays.
        {
          type: "paragraph",
          content: [
            { type: "text", text: t("unknownMark"), marks: [{ type: "highlight" }] },
          ],
        },
      ],
    } as unknown as BlogDoc} />;
  },
};

/** Nothing to render: the wrapper still exists, and nothing throws. */
export const Empty: Story = {
  args: { doc: doc() },
};
