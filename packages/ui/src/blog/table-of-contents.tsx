import type { BlogDoc } from "@noalhub/api/blog";
import { collectHeadings, TOC_MIN_HEADINGS } from "@noalhub/core/blog/headings";
import { useTranslations } from "next-intl";

import { Typography } from "../typography";

/**
 * Mục lục dựng **thẳng từ JSON**, không cần backend và không parse HTML (§3.3).
 *
 * Dùng chung `collectHeadings` với renderer nên `href="#id"` ở đây luôn khớp
 * `id` mà renderer đặt vào DOM — kể cả khi bài có hai heading trùng tên và id
 * phải thêm hậu tố.
 */
export function TableOfContents({ doc }: { doc: BlogDoc }) {
  // `common`: component này dùng ở cả trang bài viết (web) lẫn tab Xem trước
  // của editor (admin), nên không được ghim namespace của riêng một app (§6).
  const t = useTranslations("common");
  const headings = collectHeadings(doc);

  // Mục lục hai dòng chỉ tốn chỗ (§3.3).
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
