import type { BlogDoc } from "@noalhub/api/blog";
import { collectHeadings, TOC_MIN_HEADINGS } from "@noalhub/core/blog/headings";
import { useTranslations } from "next-intl";

import { Typography } from "../typography";

/**
 * A table of contents built **straight from the JSON** — no backend call, no
 * HTML parsing (§3.3).
 *
 * It shares `collectHeadings` with the renderer, so every `href="#id"` here
 * matches the `id` the renderer puts in the DOM — including when a post has two
 * headings with the same text and the ids need a suffix.
 */
export function TableOfContents({ doc }: { doc: BlogDoc }) {
  // `common`: this component is used both on the post page (web) and in the
  // editor's preview tab (admin), so it must not pin one app's namespace (§6).
  const t = useTranslations("common");
  const headings = collectHeadings(doc);

  // A two-line table of contents is just clutter (§3.3).
  if (headings.length < TOC_MIN_HEADINGS) return null;

  return (
    <nav
      aria-labelledby="toc-heading"
      className="rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15"
    >
      <Typography
        variant="body-4"
        weight={500}
        as="h2"
        id="toc-heading"
        className="uppercase tracking-wide opacity-60"
      >
        {t("tocHeading")}
      </Typography>
      <ol className="mt-2 flex flex-col gap-1.5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-4" : undefined}>
            <a href={`#${heading.id}`} className="opacity-80 hover:underline hover:opacity-100">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
