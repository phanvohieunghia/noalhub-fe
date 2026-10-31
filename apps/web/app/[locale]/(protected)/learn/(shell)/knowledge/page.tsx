import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {getTranslations, setRequestLocale} from 'next-intl/server'

import {LearnKnowledge} from '@/components/learn/learn-knowledge'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/learn/knowledge'>): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'web.learn'})
  return {title: t('knowledge.title')}
}

export default async function Page({
  params,
}: PageProps<'/[locale]/learn/knowledge'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <IntlProvider namespace="web.learn">
      <LearnKnowledge />
    </IntlProvider>
  )
}
