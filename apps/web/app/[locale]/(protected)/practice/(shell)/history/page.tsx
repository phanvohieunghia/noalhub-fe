import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {getTranslations, setRequestLocale} from 'next-intl/server'

import {LearnHistory} from '@/components/learn/learn-history'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/practice/history'>): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'web.learn'})
  return {title: t('history.title')}
}

export default async function Page({
  params,
}: PageProps<'/[locale]/practice/history'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <IntlProvider namespace="web.learn">
      <LearnHistory />
    </IntlProvider>
  )
}
