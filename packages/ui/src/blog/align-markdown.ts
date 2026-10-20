/**
 * Block alignment inside a markdown string.
 *
 * Markdown has no alignment either. The value rides as an HTML comment at the
 * end of the block's last line — `## Title <!--align:center-->` — because a
 * comment is the one piece of HTML every markdown reader hides: one that knows
 * nothing of it shows an ordinary left-aligned paragraph, not stray characters.
 *
 * No `@tiptap/*` import: `MarkdownContent` runs in the public bundle.
 */

export type MarkdownAlign = "center" | "right" | "justify";

const MARKER = /^<!--align:(center|right|justify)-->$/;

/** The marker to append to a block's markdown, or `""` for the default (left). */
export function formatAlignMarker(align: unknown): string {
  return align === "center" || align === "right" || align === "justify"
    ? ` <!--align:${align}-->`
    : "";
}

/** `<!--align:center-->` → `"center"`; anything else → `null`. */
export function parseAlignMarker(raw: string | undefined): MarkdownAlign | null {
  const match = raw ? MARKER.exec(raw.trim()) : null;
  return match ? (match[1] as MarkdownAlign) : null;
}

type InlineToken = { type?: string; raw?: string; text?: string };

/**
 * Splits the trailing marker off a block's inline tokens (marked's lexer).
 * The text before it keeps no dangling space.
 */
export function takeAlignMarker<T extends InlineToken>(
  tokens: T[],
): { align: MarkdownAlign | null; tokens: T[] } {
  const last = tokens[tokens.length - 1];
  if (!last || last.type !== "html") return { align: null, tokens };
  const align = parseAlignMarker(last.raw);
  if (!align) return { align: null, tokens };

  const rest = tokens.slice(0, -1);
  const tail = rest[rest.length - 1];
  if (tail && tail.type === "text" && typeof tail.raw === "string") {
    rest[rest.length - 1] = {
      ...tail,
      raw: tail.raw.replace(/\s+$/, ""),
      text: tail.text?.replace(/\s+$/, ""),
    };
  }
  return { align, tokens: rest };
}

/** The class `post-prose.css` styles — shared by the JSON and markdown renderers. */
export function alignClassName(align: unknown): string | undefined {
  return align === "center" || align === "right" || align === "justify"
    ? `post-prose-align-${align}`
    : undefined;
}
