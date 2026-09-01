import Link from "next/link";

import { getBlogCategories } from "@noalhub/api/blog/server";

/**
 * Khung của vùng **công khai** (blog). Thiếu file này thì blog thừa hưởng root
 * layout, mà root layout chỉ bọc `AuthProvider` + `QueryProvider` và **không có
 * header/footer nào**: bài viết nổi lơ lửng, không đường về `/blogs`, không nav,
 * không footer (`docs/blog-plan.md` §6.1).
 *
 * **Chuyên mục nằm ở nav chính** — đó là lý do nó tồn tại như một trục riêng
 * (§2.6). Thẻ thì KHÔNG lên nav, chỉ xuất hiện dưới mỗi bài: cho cả hai trục lên
 * nav là tự tạo ra hàng chục URL gần trùng nhau.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nav hỏng không được làm chết trang bài viết: backend sập thì bài vẫn phải
  // đọc được (nó có cache riêng). `error.tsx` của `/blogs` lo lỗi của NỘI DUNG,
  // còn đây chỉ là điều hướng.
  const categories = await getBlogCategories().catch(() => []);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/blogs" className="text-base font-semibold">
            Noalhub Blog
          </Link>

          <nav aria-label="Chuyên mục" className="flex flex-wrap items-center gap-4 text-sm">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/blogs/category/${category.slug}`}
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <Link href="/login" className="ml-auto text-sm opacity-70 hover:opacity-100">
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-t border-black/10 dark:border-white/15">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm opacity-60">
          <p>© {new Date().getFullYear()} Noalhub</p>
          <nav aria-label="Liên kết chân trang" className="flex items-center gap-4">
            <Link href="/blogs" className="hover:underline">
              Bài viết
            </Link>
            <Link href="/blogs/tag" className="hover:underline">
              Thẻ
            </Link>
            <a href="/blogs/rss.xml" className="hover:underline">
              RSS
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
