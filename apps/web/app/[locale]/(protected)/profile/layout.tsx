import {setRequestLocale} from 'next-intl/server'

import {MobileNav} from '@/components/layout/mobile-nav'
import {SiteHeader} from '@/components/layout/site-header'

/** Your profile and other people's both keep the app header and, on phones, the bottom nav. */
export default async function ProfileLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <MobileNav />
    </div>
  )
}
