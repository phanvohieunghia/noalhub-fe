import {IntlProvider} from '@noalhub/i18n/provider'
import {setRequestLocale} from 'next-intl/server'

import {MobileNav} from '@/components/layout/mobile-nav'
import {SiteHeader} from '@/components/layout/site-header'
import {SiteFooter} from '@/components/layout/site-footer'

/**
 * The shell of the **public** area (the blog). Without this file the blog
 * inherits the root layout, which only wraps `AuthProvider` + `QueryProvider`
 * and has **no header or footer at all**: posts float free, with no way back to
 * `/blogs`, no nav and no footer (`docs/blog.md` §6.1).
 *
 * **Categories are a filter row under the listing title**, not a bar in the shell
 * (§2.6). Tags appear only under each post: putting both axes in navigation
 * manufactures dozens of near-duplicate URLs.
 */
export default async function PublicLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const {locale} = await params
  // Repeated in each route group: `setRequestLocale` only applies to the branch
  // being rendered, and missing it drops the blog out of static rendering
  // (§3.1).
  setRequestLocale(locale)

  return (
    <IntlProvider namespace="web.blog">
      <div className="flex min-h-full flex-1 flex-col">
        <SiteHeader />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {children}
        </main>

        <SiteFooter />
        <MobileNav />
      </div>
    </IntlProvider>
  )
}
