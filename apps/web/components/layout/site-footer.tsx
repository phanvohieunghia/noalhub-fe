import {getKnowledgeDatasets} from '@noalhub/api/qa/server'
import {Link} from '@noalhub/i18n/navigation'
import {getTranslations} from 'next-intl/server'
import {Typography} from '@noalhub/ui/typography'

/**
 * The footer shared by the public area (the blog) and the home page: the
 * public Knowledge banks (when there are any), the copyright line and the
 * legal/contact links.
 *
 * Hidden on phones (the bottom nav is the navigation there); from `md` one row
 * (copyright left, links right) under the Knowledge row. Chat does NOT use this footer: the chat layout is exactly
 * viewport-height (a sidebar plus a self-scrolling message pane), and inserting
 * a footer pushes the composer off screen.
 */
export async function SiteFooter() {
  const t = await getTranslations('nav')
  const knowledge = await getKnowledgeDatasets()

  const links = [
    {href: '/about', label: t('footer.about')},
    {href: '/terms', label: t('footer.terms')},
    {href: '/privacy', label: t('footer.privacy')},
    {href: '/contact', label: t('footer.contact')},
  ] as const

  return (
    <footer className="mt-auto hidden border-t border-border bg-surface px-12 text-body-4 text-muted-foreground md:block">
      {knowledge.length > 0 ? (
        <nav
          aria-label={t('footer.knowledge')}
          className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border py-4">
          <Link
            href="/knowledge"
            className="font-medium text-foreground transition-colors hover:text-primary">
            {t('footer.knowledge')}
          </Link>
          {knowledge.map((dataset) => (
            <Link
              key={dataset.id}
              href={`/knowledge/${dataset.id}`}
              className="transition-colors hover:text-foreground">
              {dataset.title}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="flex h-18 items-center justify-between gap-3">
        <Typography variant="body-4">
          © {new Date().getFullYear()} Noalhub
        </Typography>

        <nav aria-label={t('footer.nav')} className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
