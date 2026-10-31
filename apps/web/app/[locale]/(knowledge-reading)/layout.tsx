import {setRequestLocale} from 'next-intl/server'

import {SiteHeader} from '@/components/layout/site-header'

/**
 * Reading a bank's material (public, no sign-in): the app header stays on desktop, but there is no bottom
 * nav — the page pins its own bar and a floating button, and the nav would sit under both.
 */
export default async function ReadingLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  )
}
