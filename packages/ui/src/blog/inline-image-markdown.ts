import {parseImageTitle} from '@noalhub/api/blog'

/**
 * Markdown → markdown, run before the editor parses a source: it decides which pictures
 * stay in their line of text. The editor has two image nodes (a block `image` and an
 * inline `inlineImage`) but markdown has one syntax, so the choice rides on a hidden
 * ` ~inline` tag in the image title that `BlogImage.parseMarkdown` reads and drops.
 *
 * A picture stays inline when it has a size in its title, is at most `INLINE_MAX_HEIGHT`
 * tall, and shares its line with words. No size means we cannot tell how big it is, so it
 * keeps the old behaviour (a block).
 */

/** `![alt](url "title")` anywhere in a line; group 1 is the title. */
const IMAGE_IN_LINE = /!\[[^\]]*\]\(\s*\S+?(?:\s+"([^"]*)")?\s*\)/g
const IMAGE_ONLY_LINE = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/

/** A picture this tall (px) or shorter, sharing a line with text, stays in the line. */
export const INLINE_MAX_HEIGHT = 200

/** A line of plain prose: not a heading, list, quote, table, rule, fence or picture. */
const PROSE_LINE =
  /^(?!\s*(?:#|>|[-*+]\s|\d+[.)]\s|\||```|~~~|---|\*\*\*|!\[)).+/
const SENTENCE_END = /[.!?:;…。]\s*$/

export function prepareInlineImages(markdown: string): string {
  return markInlineImages(joinDanglingImages(markdown))
}

/**
 * `c1 hoặc⏎⏎![](u "=11x13")` — a small picture in a paragraph of its own, right after a
 * line that has not ended its sentence — belongs to that line. Glues it on. Same rule
 * `expandMarkdownImages` applies when showing older content.
 */
function joinDanglingImages(markdown: string): string {
  const out: string[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const gap = out.length - 1
    const prev = gap >= 1 && out[gap].trim() === '' ? out[gap - 1] : undefined
    const title = IMAGE_ONLY_LINE.test(line)
      ? /"([^"]*)"\s*\)\s*$/.exec(line)?.[1]
      : undefined
    const height = title ? parseImageTitle(title).height : null
    if (
      !fenced &&
      prev !== undefined &&
      height &&
      height <= INLINE_MAX_HEIGHT &&
      PROSE_LINE.test(prev) &&
      !SENTENCE_END.test(prev)
    ) {
      out.length = gap // drop the blank line…
      out[gap - 1] = `${prev.trimEnd()} ${line.trim()}` // …and glue the picture on
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

/** Tags the small pictures that share a line with words so they parse as inline images. */
function markInlineImages(markdown: string): string {
  let fenced = false
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
      if (fenced || line.replace(IMAGE_IN_LINE, '').trim() === '') return line
      return line.replace(IMAGE_IN_LINE, (whole, title: string | undefined) => {
        const {height} = parseImageTitle(title)
        if (!title || !height || height > INLINE_MAX_HEIGHT) return whole
        return whole.replace(/"\s*\)$/, ` ~inline")`)
      })
    })
    .join('\n')
}
