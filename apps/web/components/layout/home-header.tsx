import {routes} from '@noalhub/core/routes'
import {SiteHeader} from '@noalhub/ui/site-header'
import {getTranslations} from 'next-intl/server'

import {HeaderAccount} from './header-account'

/**
 * The home page header (Figma `Header`, `Auth=Public` / `Public signed in`): the
 * shared `SiteHeader` in its floating `home` look, with the account slot picked
 * from the auth store by `HeaderAccount`.
 */
export async function HomeHeader() {
  const t = await getTranslations('nav')

  return (
    <SiteHeader
      variant="home"
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
