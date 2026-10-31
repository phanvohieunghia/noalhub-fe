import {setRequestLocale} from 'next-intl/server'

import {MobileNav} from '@/components/layout/mobile-nav'
import {SiteFooter} from '@/components/layout/site-footer'
import {SiteHeader} from '@/components/layout/site-header'

/** The public Knowledge catalogue: app header, footer and, on phones, the bottom nav. */
export default async function KnowledgeListLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <MobileNav />
    </div>
  )
}
