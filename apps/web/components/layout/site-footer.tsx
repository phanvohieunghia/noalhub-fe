import Link from "next/link";

import { getBlogCategories, getLatestPosts } from "@noalhub/api/blog/server";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";
import { Typography } from "@noalhub/ui/typography";

/**
 * Chân trang dùng chung cho vùng công khai (blog) và trang chủ.
 *
 * Chọn giao diện nằm ở đây chứ không phải header: nó là thiết lập, dùng một
 * lần rồi thôi — để trên header thì chiếm chỗ ngang hàng với điều hướng, thứ
 * user thực sự cần mỗi lần vào trang.
 *
 * Chat KHÔNG dùng footer này: layout chat là khung cao đúng viewport (sidebar +
 * khung tin nhắn tự cuộn), chèn footer vào sẽ đẩy ô nhập tin ra ngoài màn hình.
 */

/** Cột link: tiêu đề + danh sách, dùng lại cho cả 4 cột. */
function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Typography variant="title-4" as="h2">
        {title}
      </Typography>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  icon,
  children,
  external,
}: {
  href: string;
  icon?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const content = (
    <>
      {icon ? <Icon icon={icon} className="size-3.5 shrink-0 opacity-70" /> : null}
      <span className="truncate">{children}</span>
    </>
  );

  const className =
    "inline-flex items-center gap-2 text-body-3 opacity-70 transition-opacity hover:opacity-100";

  return (
    <li>
      {/* RSS và sitemap là route handler trả file, không phải trang React —
          <Link> prefetch chúng là tải rác. Dùng <a> thường. */}
      {external ? (
        <a href={href} className={className}>
          {content}
        </a>
      ) : (
        <Link href={href} className={className}>
          {content}
        </Link>
      )}
    </li>
  );
}

export async function SiteFooter() {
  // Footer không được làm chết trang: backend sập thì vẫn phải render đủ khung
  // với các link tĩnh — cùng lý do với nav ở `(public)/layout.tsx`.
  const [categories, latestPosts] = await Promise.all([
    getBlogCategories().catch(() => []),
    getLatestPosts(3).catch(() => []),
  ]);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3 lg:col-span-1">
            <Typography variant="title-3" as="p">
              Noalhub
            </Typography>
            <Typography variant="body-3" className="max-w-xs opacity-70">
              Blog và không gian trò chuyện của Noalhub. Ghi lại những gì học được
              khi dựng sản phẩm, và chỗ để bàn tiếp về chúng.
            </Typography>
          </div>

          <FooterColumn title="Bài viết mới">
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => (
                <FooterLink key={post.slug} href={`/blogs/${post.slug}`}>
                  {post.title}
                </FooterLink>
              ))
            ) : (
              <Typography variant="body-3" className="opacity-50">
                Chưa có bài viết.
              </Typography>
            )}
          </FooterColumn>

          <FooterColumn title="Chuyên mục">
            {categories.length > 0 ? (
              <>
                {/* Cắt 4 mục: footer là lối tắt, không phải bản sao của trang
                    danh sách — link "Tất cả" ở dưới lo phần còn lại. */}
                {categories.slice(0, 4).map((category) => (
                  <FooterLink key={category.slug} href={`/blogs/category/${category.slug}`}>
                    {category.name}
                  </FooterLink>
                ))}
                <FooterLink href="/blogs/category" icon={ICONS.chevronRight}>
                  Tất cả chuyên mục
                </FooterLink>
              </>
            ) : (
              <Typography variant="body-3" className="opacity-50">
                Chưa có chuyên mục.
              </Typography>
            )}
          </FooterColumn>

          <FooterColumn title="Khám phá">
            <FooterLink href="/blogs" icon={ICONS.post}>
              Tất cả bài viết
            </FooterLink>
            <FooterLink href="/blogs/tag" icon={ICONS.tag}>
              Thẻ
            </FooterLink>
            <FooterLink href="/blogs/rss.xml" icon={ICONS.rss} external>
              RSS
            </FooterLink>
            <FooterLink href="/sitemap.xml" icon={ICONS.map} external>
              Sitemap
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-6">
          <Typography variant="body-4" className="opacity-60">
            © {new Date().getFullYear()} Noalhub
          </Typography>

          {/* Các trang này nằm sau `AuthGuard`; khách chưa đăng nhập bấm vào sẽ
              được đưa về /login rồi quay lại — chủ ý, không phải link hỏng. */}
          <nav aria-label="Liên kết chân trang" className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="text-body-4 opacity-60 hover:opacity-100">
              Đăng nhập
            </Link>
            <Link href="/register" className="text-body-4 opacity-60 hover:opacity-100">
              Đăng ký
            </Link>
            <Link href="/chat" className="text-body-4 opacity-60 hover:opacity-100">
              Tin nhắn
            </Link>
            <Link href="/friends" className="text-body-4 opacity-60 hover:opacity-100">
              Bạn bè
            </Link>
          </nav>

          {/* `ml-auto` đẩy sang mép phải; khi xuống dòng trên màn hẹp thì nó tự
              thành dòng riêng, không cần breakpoint. */}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
