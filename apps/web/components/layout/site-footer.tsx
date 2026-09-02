import { getBlogCategories, getLatestPosts } from "@noalhub/api/blog/server";
import { DEFAULT_LOCALE } from "@noalhub/i18n/config";
import { Link } from "@noalhub/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";
import { Typography } from "@noalhub/ui/typography";

import { WebLanguageSwitcher } from "./language-switcher";

/**
 * The footer shared by the public area (the blog) and the home page.
 *
 * The appearance controls live here rather than in the header: they are
 * settings, used once and then forgotten — in the header they would sit at the
 * same level as navigation, which users actually need on every visit.
 *
 * Chat does NOT use this footer: the chat layout is exactly viewport-height (a
 * sidebar plus a self-scrolling message pane), and inserting a footer pushes the
 * composer off screen.
 */

/** A link column: a heading plus a list, reused for all 4 columns. */
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
      {/* RSS and the sitemap are route handlers serving files, not React pages —
          <Link> would prefetch junk. A plain <a> instead; the paths already
          include the locale, so there is nothing for <Link> to prefix. */}
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
  const t = await getTranslations("nav");

  // The footer must not kill the page: with the backend down it still has to
  // render the full shell with its static links — same reason as the nav in
  // `(public)/layout.tsx`.
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
              {t("footer.tagline")}
            </Typography>
          </div>

          <FooterColumn title={t("footer.latestPosts")}>
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => (
                <FooterLink key={post.slug} href={`/blogs/${post.slug}`}>
                  {post.title}
                </FooterLink>
              ))
            ) : (
              <Typography variant="body-3" className="opacity-50">
                {t("footer.noPosts")}
              </Typography>
            )}
          </FooterColumn>

          <FooterColumn title={t("footer.categories")}>
            {categories.length > 0 ? (
              <>
                {/* Capped at 4: the footer is a shortcut, not a copy of the
                    listing page — the "All" link below covers the rest. */}
                {categories.slice(0, 4).map((category) => (
                  <FooterLink key={category.slug} href={`/blogs/category/${category.slug}`}>
                    {category.name}
                  </FooterLink>
                ))}
                <FooterLink href="/blogs/category" icon={ICONS.chevronRight}>
                  {t("footer.allCategories")}
                </FooterLink>
              </>
            ) : (
              <Typography variant="body-3" className="opacity-50">
                {t("footer.noCategories")}
              </Typography>
            )}
          </FooterColumn>

          <FooterColumn title={t("footer.explore")}>
            <FooterLink href="/blogs" icon={ICONS.post}>
              {t("footer.allPosts")}
            </FooterLink>
            <FooterLink href="/blogs/tag" icon={ICONS.tag}>
              {t("footer.tags")}
            </FooterLink>
            <FooterLink href={`/${DEFAULT_LOCALE}/blogs/rss.xml`} icon={ICONS.rss} external>
              {t("footer.rss")}
            </FooterLink>
            <FooterLink href="/sitemap.xml" icon={ICONS.map} external>
              {t("footer.sitemap")}
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-6">
          <Typography variant="body-4" className="opacity-60">
            © {new Date().getFullYear()} Noalhub
          </Typography>

          {/* These pages sit behind `AuthGuard`; a signed-out visitor clicking one
              is sent to /login and then back — deliberate, not a broken link. */}
          <nav aria-label={t("footer.nav")} className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="text-body-4 opacity-60 hover:opacity-100">
              {t("login")}
            </Link>
            <Link href="/register" className="text-body-4 opacity-60 hover:opacity-100">
              {t("register")}
            </Link>
            <Link href="/chat" className="text-body-4 opacity-60 hover:opacity-100">
              {t("footer.chat")}
            </Link>
            <Link href="/friends" className="text-body-4 opacity-60 hover:opacity-100">
              {t("footer.friends")}
            </Link>
          </nav>

          {/* `ml-auto` pushes it to the right edge; when it wraps on a narrow
              screen it becomes its own line, with no breakpoint needed. */}
          <div className="ml-auto flex items-center gap-3">
            <WebLanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
