import Image from "next/image";
import { Fragment } from "react";

import { isSafeImageSrc, isSafeLinkHref } from "@noalhub/api/blog";
import type {
  BlogBlockNode,
  BlogDoc,
  BlogInlineNode,
  BlogListItemNode,
  BlogTextNode,
} from "@noalhub/api/blog";
import { collectHeadings } from "@noalhub/core/blog/headings";

import "./post-content.css";

/**
 * The Tiptap JSON → React renderer. **One code path** for `apps/web` (the real
 * thing) and `apps/admin` (the preview, §8) — which is why the preview can
 * never drift from what readers see.
 *
 * Three constraints, all justified in `docs/blog.md`:
 *
 * 1. **Never import `@tiptap/*`** (§3.2). Touching Tiptap drags the whole
 *    editor into `apps/web`'s public bundle, where nobody edits anything.
 *    Tiptap exists only inside `apps/admin`.
 * 2. **No path that emits raw HTML** (§3). No `dangerouslySetInnerHTML`, no
 *    `innerHTML` — safety by architecture rather than by discipline.
 * 3. **Unknown nodes/attrs are dropped silently, never thrown on** (§3.1). One
 *    strange node must not blank out an entire post.
 *
 * `sanitizeBlogDoc` (the schema layer) already filters once on the way in; the
 * `isSafeLinkHref`/`isSafeImageSrc` checks below are a **second layer**,
 * deliberately redundant: the renderer receives docs from several paths (server
 * fetch, cache, editor state) and one path forgetting to filter is enough for
 * stored XSS (§3.1a).
 */
export function PostContent({ doc }: { doc: BlogDoc }) {
  // Walk the tree ONCE for de-duplicated ids — the same function the table of
  // contents uses, so anchors and the TOC cannot diverge (§3.3).
  const headings = collectHeadings(doc);
  let headingCursor = 0;

  return (
    <div className="blog-content">
      {doc.content.map((node, index) => {
        const headingId =
          node.type === "heading" ? headings[headingCursor++]?.id : undefined;
        return <Block key={index} node={node} headingId={headingId} />;
      })}
    </div>
  );
}

function Block({
  node,
  headingId,
}: {
  node: BlogBlockNode;
  headingId?: string;
}) {
  switch (node.type) {
    case "paragraph":
      // An empty paragraph is how an author adds a pause — keep the line height.
      return <p>{node.content?.length ? <Inline nodes={node.content} /> : <br />}</p>;

    case "heading": {
      // `<h1>` is the post title (§6.2), so content only ever has h2/h3.
      const Tag = node.attrs.level === 3 ? "h3" : "h2";
      return <Tag id={headingId}>{<Inline nodes={node.content ?? []} />}</Tag>;
    }

    case "bulletList":
      return (
        <ul>
          <ListItems items={node.content} />
        </ul>
      );

    case "orderedList":
      return (
        <ol>
          <ListItems items={node.content} />
        </ol>
      );

    case "blockquote":
      return (
        <blockquote>
          {node.content.map((child, index) => (
            <Block key={index} node={child} />
          ))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre>
          <code
            className={node.attrs.language ? `language-${node.attrs.language}` : undefined}
          >
            {node.content?.map((child) => child.text).join("") ?? ""}
          </code>
        </pre>
      );

    case "horizontalRule":
      return <hr />;

    case "image":
      return <ContentImage node={node} />;

    default:
      return null;
  }
}

function ListItems({ items }: { items: BlogListItemNode[] }) {
  return (
    <>
      {items.map((item, index) => (
        <li key={index}>
          {item.content.map((child, childIndex) => (
            <Block key={childIndex} node={child} />
          ))}
        </li>
      ))}
    </>
  );
}

/**
 * An image inside a post.
 *
 * With real `width`/`height` → `next/image` uses the exact dimensions. With
 * `null` (the editor could not measure: dead image, CORS) → an `aspect-video`
 * frame plus `fill` and `object-contain`: the image is not distorted and, more
 * importantly, there is **no CLS** — a Core Web Vitals metric, and therefore
 * squarely inside this plan's SEO goal (§3.1b).
 */
function ContentImage({
  node,
}: {
  node: Extract<BlogBlockNode, { type: "image" }>;
}) {
  const { src, alt, width, height } = node.attrs;
  // The second line of defence — see the note at the top of this file.
  if (!isSafeImageSrc(src)) return null;

  if (width && height) {
    return (
      <figure>
        <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 768px) 100vw, 768px" />
      </figure>
    );
  }

  return (
    <figure className="relative aspect-video w-full">
      <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 768px" />
    </figure>
  );
}

function Inline({ nodes }: { nodes: BlogInlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) =>
        node.type === "hardBreak" ? (
          <br key={index} />
        ) : (
          <Text key={index} node={node} />
        ),
      )}
    </>
  );
}

function Text({ node }: { node: BlogTextNode }) {
  const marks = node.marks ?? [];
  let content: React.ReactNode = node.text;

  // Character marks wrap from the inside out; `link` is applied last so it is
  // the outermost tag — `<a><strong>…</strong></a>`, not the other way round.
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        content = <strong>{content}</strong>;
        break;
      case "italic":
        content = <em>{content}</em>;
        break;
      case "strike":
        content = <s>{content}</s>;
        break;
      case "code":
        content = <code>{content}</code>;
        break;
      default:
        break;
    }
  }

  const link = marks.find((mark) => mark.type === "link");
  // An href failing the constraints → no <a> is rendered but the child text is
  // KEPT: a bad link degrades to plain text rather than losing words (§3.1a).
  if (link && isSafeLinkHref(link.attrs.href)) {
    const isInternal = link.attrs.href.startsWith("/");
    content = (
      <a
        href={link.attrs.href}
        // `target`/`rel` are set by the renderer, NEVER taken from data (§3.1a).
        {...(isInternal ? {} : { target: "_blank", rel: "nofollow noopener" })}
      >
        {content}
      </a>
    );
  }

  return <Fragment>{content}</Fragment>;
}
