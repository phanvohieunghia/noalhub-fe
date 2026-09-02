import type { BlogDoc, BlogHeadingLevel, BlogInlineNode } from "@noalhub/api/blog";

import { slugify } from "./slugify";

export type BlogHeading = {
  id: string;
  level: BlogHeadingLevel;
  text: string;
};

/** Fewer than 3 headings means no TOC — a two-line table of contents is just clutter (§3.3). */
export const TOC_MIN_HEADINGS = 3;

/**
 * Walks **the whole tree in one pass**, collecting every heading with a
 * de-duplicated `id`.
 *
 * Why one pass: two headings with the same text produce the same `id`, and the
 * anchor would always jump to the first one. Numbering the duplicates
 * (`gioi-thieu`, `gioi-thieu-2`) is only correct with the full list in hand —
 * it cannot be done per isolated node (§3.3).
 *
 * The renderer (`post-content.tsx`) and the table of contents
 * (`table-of-contents.tsx`) call THIS function on the same doc, so the two can
 * never disagree.
 */
export function collectHeadings(doc: BlogDoc): BlogHeading[] {
  const headings: BlogHeading[] = [];
  const used = new Map<string, number>();

  for (const node of doc.content) {
    if (node.type !== "heading") continue;

    const text = inlineText(node.content);
    // An empty heading still needs a stable id, or two empty ones collide again.
    const base = slugify(text) || `muc-${headings.length + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);

    headings.push({
      id: seen === 0 ? base : `${base}-${seen + 1}`,
      level: node.attrs.level,
      text,
    });
  }

  return headings;
}

function inlineText(content: BlogInlineNode[] | undefined): string {
  if (!content) return "";
  return content
    .map((node) => (node.type === "text" ? node.text : " "))
    .join("")
    .trim();
}
