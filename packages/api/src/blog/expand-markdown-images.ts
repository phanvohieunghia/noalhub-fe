import { parseImageTitle } from "./image-size-title";
import { isSafeImageSrc } from "./schemas";
import type { BlogBlockNode, BlogDoc, BlogInlineNode } from "./types";

/** `![alt](url "title")` — the title carries size and alignment, see `image-size-title.ts`. */
const MD_IMAGE = /!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"([^"]*)")?\s*\)/g;

/** A picture (SVG or raster) this tall (px) or shorter, written inside a sentence, stays in the line. */
const INLINE_MAX_HEIGHT = 200;

/**
 * Whether the picture at `start…end` stays in its line of text: other words share the
 * line and the title says it is small. An SVG follows the same rule as any picture — it
 * is still loaded as an `<img>`, never inlined into the DOM.
 */
function staysInline(text: string, start: number, end: number, height: number) {
  if (height > INLINE_MAX_HEIGHT) return false;
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = text.indexOf("\n", end);
  const around = text.slice(lineStart, start) + text.slice(end, lineEnd === -1 ? undefined : lineEnd);
  return around.trim().length > 0;
}

/**
 * Read-only fix-up for text that was written as markdown but stored as a doc: a
 * paragraph holding `![alt](url "=300x167 ~center")` as literal characters becomes
 * a real `image` block, split out of the paragraph around it. An image whose host
 * `isSafeImageSrc` refuses stays as the text it was, so nothing silently vanishes.
 *
 * A small picture (SVG or not) in the middle of a sentence is the exception: it stays in
 * the line as an `inlineImage`. A big one, or one alone on its line, is split out.
 *
 * Images with no alignment of their own come out centred. Never use it on content being edited — it changes the shape of the document.
 */
export function expandMarkdownImages(doc: BlogDoc): BlogDoc {
  return { ...doc, content: expandBlocks(doc.content) };
}

/** A paragraph that is nothing but one `![alt](url "=WxH")`. */
const ONLY_IMAGE = new RegExp(`^\\s*${MD_IMAGE.source}\\s*$`);

/** A sentence that has not ended yet: its last word is waiting for the picture that follows. */
const SENTENCE_END = /[.!?:;…。]$/;

/**
 * A picture the author put on its own straight after an unfinished line
 * (`c1 hoặc⏎⏎![](…)`) belongs to that line. When it is small enough to sit in text it is
 * glued onto the previous paragraph, so it stays in the line. It arrives either as a
 * paragraph holding the markdown (`ONLY_IMAGE`) or, once the editor has parsed it, as a real
 * `image` block.
 */
function joinDanglingImages(blocks: BlogBlockNode[]): BlogBlockNode[] {
  const out: BlogBlockNode[] = [];
  for (const block of blocks) {
    const prev = out[out.length - 1];
    const tail = prev?.type === "paragraph" ? prev.content?.[prev.content.length - 1] : undefined;
    const open = prev?.type === "paragraph" && tail?.type === "text" && tail.text.trim() !== "" && !SENTENCE_END.test(tail.text.trim());
    if (!open) {
      out.push(block);
      continue;
    }

    if (block.type === "image") {
      const { src, alt, width, height } = block.attrs;
      if (isSafeImageSrc(src) && width && height && height <= INLINE_MAX_HEIGHT) {
        out[out.length - 1] = {
          ...prev,
          content: [...prev.content!, { type: "inlineImage", attrs: { src, alt, width, height } }],
        };
        continue;
      }
    }

    const only = block.type === "paragraph" && block.content?.length === 1 && block.content[0].type === "text"
      ? ONLY_IMAGE.exec(block.content[0].text)
      : null;
    if (only && isSafeImageSrc(only[2]) && (parseImageTitle(only[3]).height ?? Infinity) <= INLINE_MAX_HEIGHT) {
      const content = [...prev.content!];
      content[content.length - 1] = { ...tail!, text: `${(tail as { text: string }).text.trimEnd()} ${only[0].trim()}` };
      out[out.length - 1] = { ...prev, content };
      continue;
    }
    out.push(block);
  }
  return out;
}

function expandBlocks(blocks: BlogBlockNode[]): BlogBlockNode[] {
  return joinDanglingImages(blocks).flatMap((block): BlogBlockNode[] => {
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
    let afterInline = false;
    for (const match of node.text.matchAll(MD_IMAGE)) {
      const [whole, alt, src, rawTitle] = match;
      if (!isSafeImageSrc(src)) continue;
      const size = parseImageTitle(rawTitle);
      const end = match.index + whole.length;
      if (size.width && size.height && staysInline(node.text, match.index, end, size.height)) {
        const before = node.text.slice(last, match.index);
        if (before) buffer.push({ ...node, text: before });
        buffer.push({ type: "inlineImage", attrs: { src, alt, width: size.width, height: size.height } });
        last = end;
        afterInline = true;
        continue;
      }
      afterInline = false;
      const before = node.text.slice(last, match.index).trimEnd();
      if (before) buffer.push({ ...node, text: before });
      flush();
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
    const rest = afterInline ? node.text.slice(last) : node.text.slice(last).trimStart();
    if (rest) buffer.push({ ...node, text: last === 0 ? node.text : rest });
  }
  flush();
  return out;
}
