import type { BlogDoc } from "@noalhub/api/blog";
import { collectHeadings, TOC_MIN_HEADINGS } from "@noalhub/core/blog/headings";

/**
 * Mục lục dựng **thẳng từ JSON**, không cần backend và không parse HTML (§3.3).
 *
 * Dùng chung `collectHeadings` với renderer nên `href="#id"` ở đây luôn khớp
 * `id` mà renderer đặt vào DOM — kể cả khi bài có hai heading trùng tên và id
 * phải thêm hậu tố.
 */
export function TableOfContents({ doc }: { doc: BlogDoc }) {
  const headings = collectHeadings(doc);

  // Mục lục hai dòng chỉ tốn chỗ (§3.3).
  if (headings.length < TOC_MIN_HEADINGS) return null;

  return (
    <nav
      aria-labelledby="toc-heading"
      className="rounded-lg border border-black/10 p-4 text-sm dark:border-white/15"
    >
      <h2 id="toc-heading" className="text-xs font-medium uppercase tracking-wide opacity-60">
        Trong bài này
      </h2>
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
