/**
 * Image size inside a markdown string.
 *
 * Markdown has no field for dimensions, and a made-up `![](url =300x200)` is
 * not an image to CommonMark — `react-markdown` (and anything else that reads
 * the stored text) would show it as literal characters. The same information
 * in the image's **title**, `![alt](url "=300x200")`, parses everywhere: a
 * reader that knows nothing of it shows a plain image.
 *
 * No `@tiptap/*` import: `MarkdownContent` runs in the public bundle.
 */

const SIZE = /(?:^|\s)=(\d{1,5})x(\d{1,5})$/;

/** Alignment rides after the size: `"caption =300x200 ~center"`. Left is the default and is not written. */
const ALIGN = /(?:^|\s)~(center|right)$/;
/** Share of the column: `"=50%"`, between the size and the alignment. */
const PERCENT = /(?:^|\s)=(\d{1,3})%$/;

export type ImageAlign = "center" | "right";

/** `"caption =300x200 ~center"` → `{ title: "caption", width: 300, height: 200, align: "center" }`. */
export function parseImageTitle(raw: string | null | undefined): {
  title: string | null;
  width: number | null;
  height: number | null;
  align: ImageAlign | null;
  widthPercent: number | null;
} {
  let text = raw ?? "";
  const alignMatch = ALIGN.exec(text);
  const align = alignMatch ? (alignMatch[1] as ImageAlign) : null;
  if (alignMatch) text = text.slice(0, alignMatch.index).trim();
  const percentMatch = PERCENT.exec(text);
  const percent = percentMatch ? Number(percentMatch[1]) : 0;
  const widthPercent = percent >= 1 && percent <= 100 ? percent : null;
  if (percentMatch && widthPercent) text = text.slice(0, percentMatch.index).trim();

  const match = SIZE.exec(text);
  if (!match) return { title: text || null, width: null, height: null, align, widthPercent };
  const width = Number(match[1]);
  const height = Number(match[2]);
  const title = text.slice(0, match.index).trim();
  if (!width || !height) return { title: text || null, width: null, height: null, align, widthPercent };
  return { title: title || null, width, height, align, widthPercent };
}

/** The inverse: the title string to store, or `null` when there is nothing to say. */
export function formatImageTitle(
  title: string | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
  align?: string | null,
  widthPercent?: number | null,
): string | null {
  const size = width && height ? `=${Math.round(width)}x${Math.round(height)}` : "";
  const share = widthPercent && widthPercent >= 1 && widthPercent <= 100 ? `=${Math.round(widthPercent)}%` : "";
  const side = align === "center" || align === "right" ? `~${align}` : "";
  const text = [title?.replace(/"/g, "'").trim(), size, share, side].filter(Boolean).join(" ");
  return text || null;
}
