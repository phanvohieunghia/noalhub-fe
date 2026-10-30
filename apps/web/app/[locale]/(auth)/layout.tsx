import {IntlProvider} from '@noalhub/i18n/provider'
import {setRequestLocale} from 'next-intl/server'

import {AuthShell} from '@/components/auth/auth-shell'

export default async function AuthLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <IntlProvider namespace="web.auth">
      <AuthShell>{children}</AuthShell>
    </IntlProvider>
  )
}
