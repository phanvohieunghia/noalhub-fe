import {setRequestLocale} from 'next-intl/server'

import {MobileNav} from '@/components/layout/mobile-nav'
import {SiteHeader} from '@/components/layout/site-header'

/** The practice area shares the app header (Figma "Attempt" screens) and, on phones, the bottom nav. */
export default async function LearnLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <MobileNav />
    </div>
  )
}
