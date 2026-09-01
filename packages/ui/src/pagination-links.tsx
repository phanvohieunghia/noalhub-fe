import Link from "next/link";

/**
 * Phân trang bằng **`<a href>` thật**, cho trang công khai.
 *
 * Vì sao không dùng lại `pagination.tsx`: bản đó là `"use client"` + nút bấm
 * `onPageChange`. Googlebot có chạy JS nhưng **không bấm nút**, nên từ trang 2
 * trở đi không có đường crawl nào từ trong site. Bài vẫn vào index qua sitemap
 * nên không mất bài; cái mất là **toàn bộ internal linking**, và URL
 * chỉ-có-trong-sitemap bị xếp ưu tiên thấp hơn (`docs/blog-plan.md` §4.5).
 *
 * Hai component chứ không sửa cái cũ: bảng admin phải giữ state ở client, hai
 * nhu cầu khác nhau.
 */
export function PaginationLinks({
  basePath,
  page,
  limit,
  total,
  label = "Phân trang",
}: {
  /** Đường dẫn không kèm query, ví dụ `/blogs` hoặc `/blogs/category/huong-dan`. */
  basePath: string;
  page: number;
  limit: number;
  total: number;
  label?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (pageCount <= 1) return null;

  // Trang 1 KHÔNG kèm `?page=1` — phải khớp canonical, nếu không `/blogs` và
  // `/blogs?page=1` là hai URL cùng nội dung (§4.5).
  const hrefFor = (target: number) =>
    target <= 1 ? basePath : `${basePath}?page=${target}`;

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3 pt-8 text-sm">
      <PageLink
        href={hrefFor(page - 1)}
        // `rel="prev"/"next"`: Google đã bỏ dùng từ 2019, nhưng Bing và RSS
        // reader vẫn đọc. Đặt thì có, đừng trông cậy vào nó thay cho <a> thật.
        rel="prev"
        disabled={page <= 1}
      >
        ← Trang trước
      </PageLink>

      <span className="tabular-nums opacity-60">
        Trang {page}/{pageCount}
      </span>

      <PageLink href={hrefFor(page + 1)} rel="next" disabled={page >= pageCount}>
        Trang sau →
      </PageLink>
    </nav>
  );
}

/**
 * Ở hai đầu danh sách thì render `<span>` chứ không phải link bị `aria-disabled`:
 * một thẻ `<a>` không có `href` vẫn được crawler thử, và một link trỏ tới trang
 * 0 là URL rác trong log.
 */
function PageLink({
  href,
  rel,
  disabled,
  children,
}: {
  href: string;
  rel: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="opacity-30">{children}</span>;
  }

  return (
    <Link
      href={href}
      rel={rel}
      className="rounded-md border border-black/15 px-3 py-1.5 transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
