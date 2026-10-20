import { parseImageTitle } from "./image-size-title";
import { isSafeImageSrc } from "./schemas";
import type { BlogBlockNode, BlogDoc, BlogInlineNode } from "./types";

/** `![alt](url "title")` — the title carries size and alignment, see `image-size-title.ts`. */
const MD_IMAGE = /!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"([^"]*)")?\s*\)/g;

/**
 * Read-only fix-up for text that was written as markdown but stored as a doc: a
 * paragraph holding `![alt](url "=300x167 ~center")` as literal characters becomes
 * a real `image` block, split out of the paragraph around it. An image whose host
 * `isSafeImageSrc` refuses stays as the text it was, so nothing silently vanishes.
 *
 * Images with no alignment of their own come out centred. Never use it on content being edited — it changes the shape of the document.
 */
export function expandMarkdownImages(doc: BlogDoc): BlogDoc {
  return { ...doc, content: expandBlocks(doc.content) };
}

function expandBlocks(blocks: BlogBlockNode[]): BlogBlockNode[] {
  return blocks.flatMap((block): BlogBlockNode[] => {
    if (block.type === "paragraph") return expandParagraph(block);
    // A question picture sits centred under its text unless it says otherwise.
    if (block.type === "image" && !block.attrs.align) {
      return [{ ...block, attrs: { ...block.attrs, align: "center" } }];
    }
    if ("content" in block && Array.isArray(block.content)) {
      return [
        {
          ...block,
          content: expandBlocks(block.content as BlogBlockNode[]),
        } as BlogBlockNode,
      ];
    }
    return [block];
  });
}

function expandParagraph(
  paragraph: Extract<BlogBlockNode, { type: "paragraph" }>,
): BlogBlockNode[] {
  const inline = paragraph.content ?? [];
  if (!inline.some((node) => node.type === "text" && node.text.includes("!["))) {
    return [paragraph];
  }

  const out: BlogBlockNode[] = [];
  let buffer: BlogInlineNode[] = [];
  const flush = () => {
    if (buffer.length > 0) out.push({ ...paragraph, content: buffer });
    buffer = [];
  };

  for (const node of inline) {
    if (node.type !== "text") {
      buffer.push(node);
      continue;
    }
    let last = 0;
    for (const match of node.text.matchAll(MD_IMAGE)) {
      const [whole, alt, src, rawTitle] = match;
      if (!isSafeImageSrc(src)) continue;
      const before = node.text.slice(last, match.index).trimEnd();
      if (before) buffer.push({ ...node, text: before });
      flush();
      const size = parseImageTitle(rawTitle);
      out.push({
        type: "image",
        attrs: {
          src,
          alt,
          width: size.width,
          height: size.height,
          align: size.align ?? "center",
          ...(size.widthPercent ? { widthPercent: size.widthPercent } : {}),
        },
      });
      last = match.index + whole.length;
    }
    const rest = node.text.slice(last).trimStart();
    if (rest) buffer.push({ ...node, text: last === 0 ? node.text : rest });
  }
  flush();
  return out;
}
