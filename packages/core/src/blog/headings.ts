import type { BlogDoc, BlogHeadingLevel, BlogInlineNode } from "@noalhub/api/blog";

import { slugify } from "./slugify";

export type BlogHeading = {
  id: string;
  level: BlogHeadingLevel;
  text: string;
};

/** Bài có ít hơn 3 heading thì không hiện TOC — mục lục hai dòng chỉ tốn chỗ (§3.3). */
export const TOC_MIN_HEADINGS = 3;

/**
 * Quét **cả cây một lượt** lấy mọi heading kèm `id` đã khử trùng.
 *
 * Vì sao một lượt: hai heading trùng tên trong một bài cho ra hai `id` trùng, và
 * anchor sẽ luôn nhảy về cái đầu tiên. Đánh số hậu tố (`gioi-thieu`,
 * `gioi-thieu-2`) chỉ đúng khi biết toàn bộ danh sách, không làm được ở từng
 * node rời (§3.3).
 *
 * Renderer (`post-content.tsx`) và mục lục (`table-of-contents.tsx`) gọi CHUNG
 * hàm này trên cùng một doc, nên hai bên không bao giờ lệch nhau.
 */
export function collectHeadings(doc: BlogDoc): BlogHeading[] {
  const headings: BlogHeading[] = [];
  const used = new Map<string, number>();

  for (const node of doc.content) {
    if (node.type !== "heading") continue;

    const text = inlineText(node.content);
    // Heading rỗng vẫn phải có id ổn định, nếu không hai heading rỗng lại trùng.
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
