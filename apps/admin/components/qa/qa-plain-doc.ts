import type { BlogDoc, BlogInlineNode } from "@noalhub/api/blog";

/**
 * The question form edits plain text; the backend stores a Tiptap document.
 * These two functions are the whole bridge, and they only promise a round trip
 * for documents the form itself wrote.
 */

/** Blank-line separated paragraphs; a single newline is a hard break inside one. */
export function textToDoc(text: string): BlogDoc {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content: paragraphs.map((block) => {
      const content: BlogInlineNode[] = [];
      block.split("\n").forEach((line, index) => {
        if (index > 0) content.push({ type: "hardBreak" });
        if (line !== "") content.push({ type: "text", text: line });
      });
      return { type: "paragraph", content };
    }),
  };
}

/**
 * The text of a document made only of unformatted paragraphs, or `null` for
 * anything else (a table, a list, bold text…). `null` is the signal to leave the
 * field alone: flattening such a document to text would silently drop its
 * structure on the next save.
 */
export function docToText(doc: BlogDoc | null): string | null {
  if (doc === null) return "";

  const blocks: string[] = [];
  for (const block of doc.content) {
    if (block.type !== "paragraph") return null;
    let line = "";
    for (const node of block.content ?? []) {
      if (node.type === "hardBreak") line += "\n";
      else if (node.type === "inlineImage") return null;
      else if (node.marks && node.marks.length > 0) return null;
      else line += node.text;
    }
    blocks.push(line);
  }
  return blocks.join("\n\n");
}

/**
 * Words and characters of a document, for the counter under an editor. Walks every
 * node, so lists, tables and code blocks count too. Blocks are separated by a
 * space so the last word of one and the first of the next are not glued together;
 * that separator is not counted as a character. Characters include spaces, and a
 * word is a whitespace-separated run — which for Vietnamese is a syllable.
 */
export function docStats(doc: BlogDoc): { words: number; characters: number } {
  const blocks: string[] = [];
  let current = "";

  const flush = () => {
    if (current !== "") blocks.push(current);
    current = "";
  };

  const walk = (node: unknown) => {
    if (typeof node !== "object" || node === null) return;
    const { type, text, content } = node as {
      type?: string;
      text?: unknown;
      content?: unknown;
    };
    if (typeof text === "string") current += text;
    else if (type === "hardBreak") current += " ";
    if (Array.isArray(content)) {
      content.forEach(walk);
      // A node that holds other nodes is a container; one that holds text ends a block.
      if (content.some((child) => (child as { text?: unknown })?.text !== undefined)) flush();
    }
  };

  walk(doc);
  flush();

  const text = blocks.join(" ").trim();
  return {
    words: text === "" ? 0 : text.split(/\s+/).length,
    characters: blocks.reduce((sum, block) => sum + block.length, 0),
  };
}

/** Words and characters of plain text, counted like {@link docStats} so a source and its outline compare. */
export function textStats(text: string): { words: number; characters: number } {
  const trimmed = text.trim();
  return {
    words: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
    characters: text.length,
  };
}

/** Nothing a learner could read: no text anywhere and no image. */
export function isEmptyDoc(node: unknown): boolean {
  if (typeof node !== "object" || node === null) return true;
  const { type, text, content } = node as { type?: string; text?: string; content?: unknown[] };
  if (type === "image") return false;
  if (typeof text === "string" && text.trim() !== "") return false;
  return (content ?? []).every(isEmptyDoc);
}
