import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

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
 *
 * `Link` lấy từ `@noalhub/i18n/navigation` (bản của next-intl) chứ không phải
 * `next/link`: component này chỉ dùng ở phần công khai của `apps/web`, nơi URL
 * có tiền tố locale. Dùng `next/link` thì trang 2 mất tiền tố và người đọc
 * tiếng Anh bị đá về bản tiếng Việt ngay khi lật trang.
 */
export function PaginationLinks({
  basePath,
  page,
  limit,
  total,
  label,
}: {
  /** Đường dẫn không kèm query, ví dụ `/blogs` hoặc `/blogs/category/huong-dan`. */
  basePath: string;
  page: number;
  limit: number;
  total: number;
  /** Bỏ trống thì dùng nhãn chung "Phân trang". */
  label?: string;
}) {
  const t = useTranslations("common.pagination");
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (pageCount <= 1) return null;

  // Trang 1 KHÔNG kèm `?page=1` — phải khớp canonical, nếu không `/blogs` và
  // `/blogs?page=1` là hai URL cùng nội dung (§4.5).
  const hrefFor = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`);

  return (
    <nav
      aria-label={label ?? t("label")}
      className="flex items-center justify-between gap-3 pt-8 text-body-3"
    >
      <PageLink
        href={hrefFor(page - 1)}
        // `rel="prev"/"next"`: Google đã bỏ dùng từ 2019, nhưng Bing và RSS
        // reader vẫn đọc. Đặt thì có, đừng trông cậy vào nó thay cho <a> thật.
        rel="prev"
        disabled={page <= 1}
      >
        ← {t("previous")}
      </PageLink>

      <span className="tabular-nums opacity-60">{t("current", { page, total: pageCount })}</span>

      <PageLink href={hrefFor(page + 1)} rel="next" disabled={page >= pageCount}>
        {t("next")} →
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
      className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}
