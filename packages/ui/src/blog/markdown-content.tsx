import Image from "next/image";
import Markdown, { type Components, type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import { isSafeImageSrc, isSafeLinkHref } from "@noalhub/api/blog";

import "./post-content.css";

/**
 * `PostContent`'s twin for content stored as a **markdown string**. Same
 * `.blog-content` stylesheet, so the two formats read identically, and the
 * same three rules (see the note atop `post-content.tsx`):
 *
 * 1. **No `@tiptap/*`** — `react-markdown` parses on the server, so this is
 *    safe in `apps/web`'s public bundle.
 * 2. **No raw HTML** — `skipHtml` drops it; `react-markdown` never reaches for
 *    `dangerouslySetInnerHTML`.
 * 3. **Unknown elements are unwrapped, not thrown on** — `ALLOWED` mirrors the
 *    blog allowlist (§3.1); anything else keeps its text and loses its tag.
 */
export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="blog-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        allowedElements={ALLOWED}
        unwrapDisallowed
        urlTransform={safeUrl}
        components={COMPONENTS}
      >
        {markdown}
      </Markdown>
    </div>
  );
}

const ALLOWED = [
  "p", "br", "strong", "em", "del", "code", "pre", "a", "img",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "hr",
  "table", "thead", "tbody", "tr", "th", "td",
];

/**
 * The same gates the JSON path uses, applied before any component sees the
 * URL. `undefined` drops the attribute: a link degrades to its text, an image
 * to nothing (see `a`/`img` below).
 */
const safeUrl: UrlTransform = (url, key) => {
  if (key === "href") return isSafeLinkHref(url) ? url : undefined;
  if (key === "src") return isSafeImageSrc(url) ? url : undefined;
  return undefined;
};

const COMPONENTS: Components = {
  // `<h1>` is the page title and the editor stops at h4 — clamp to h2…h4 so a
  // pasted `#` or `#####` lands on a level the outline understands.
  h1: ({ children }) => <h2>{children}</h2>,
  h5: ({ children }) => <h4>{children}</h4>,
  h6: ({ children }) => <h4>{children}</h4>,

  // `<s>` rather than GFM's `<del>`, matching what `PostContent` emits.
  del: ({ children }) => <s>{children}</s>,

  a: ({ href, children }) => {
    if (!href) return <>{children}</>;
    const isInternal = href.startsWith("/");
    return (
      <a
        href={href}
        // Decided by the renderer, never taken from data (§3.1a).
        {...(isInternal ? {} : { target: "_blank", rel: "nofollow noopener" })}
      >
        {children}
      </a>
    );
  },

  /*
   * Markdown has no dimensions, so always the `aspect-video` + `fill` frame
   * `PostContent` falls back to (no CLS). A `<span>`, not `<figure>`: markdown
   * images sit inside a `<p>`, where a block element breaks hydration.
   */
  img: ({ src, alt }) => {
    if (typeof src !== "string" || !src) return null;
    return (
      <span className="relative block aspect-video w-full">
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </span>
    );
  },

  // Scrolls sideways (`post-content.css`), so it must be keyboard-reachable.
  pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,

  table: ({ children }) => (
    <div className="blog-table-scroll">
      <table>{children}</table>
    </div>
  ),
};
