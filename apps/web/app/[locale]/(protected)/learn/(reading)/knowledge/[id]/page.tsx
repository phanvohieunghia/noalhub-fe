import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {getTranslations, setRequestLocale} from 'next-intl/server'

import {LearnKnowledgeDetail} from '@/components/learn/learn-knowledge'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/learn/knowledge/[id]'>): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'web.learn'})
  return {title: t('knowledge.title')}
}

export default async function Page({
  params,
}: PageProps<'/[locale]/learn/knowledge/[id]'>) {
  const {locale, id} = await params
  setRequestLocale(locale)

  return (
    <IntlProvider namespace="web.learn">
      <LearnKnowledgeDetail datasetId={id} />
    </IntlProvider>
  )
}
