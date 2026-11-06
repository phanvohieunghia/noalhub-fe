'use client'

import {routes} from '@noalhub/core/routes'
import {SiteHeader as SiteHeaderView} from '@noalhub/ui/site-header'
import {useTranslations} from 'next-intl'

import {HeaderAccount} from './header-account'

/**
 * The app header: the shared `SiteHeader` in its `app` look, pinned to the top.
 *
 * The account slot is `HeaderAccount` (signed out / signed in). The whole
 * header is hidden below `md`, where `MobileNav` is the primary navigation.
 */
export function SiteHeader() {
  const t = useTranslations('nav')

  return (
    <SiteHeaderView
      className="sticky top-0 z-30 hidden md:block"
      navLabel={t('header.mainLinks')}
      links={[
        {href: routes.blog, label: t('header.blog')},
        {href: routes.practice, label: t('header.practice')},
        {href: routes.chat, label: t('header.chat')},
      ]}
      account={<HeaderAccount />}
    />
  )
}
