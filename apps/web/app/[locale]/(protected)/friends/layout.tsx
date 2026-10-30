import {setRequestLocale} from 'next-intl/server'

import {SiteHeader} from '@/components/layout/site-header'

/** Friends is a sub-page of chat: the app header (md+) on top, a back button in the page itself. */
export default async function FriendsLayout({
  children,
  params,
}: LayoutProps<'/[locale]/friends'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      {children}
    </div>
  )
}
