import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {Suspense} from 'react'
import {getTranslations, setRequestLocale} from 'next-intl/server'

import {LearnKnowledge} from '@/components/learn/learn-knowledge'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/knowledge'>): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale, namespace: 'web.learn'})
  return {title: t('knowledge.title')}
}

export default async function Page({params}: PageProps<'/[locale]/knowledge'>) {
  const {locale} = await params
  setRequestLocale(locale)

  return (
    <IntlProvider namespace="web.learn">
      {/* `useSearchParams` needs a boundary to keep the page static. */}
      <Suspense>
        <LearnKnowledge />
      </Suspense>
    </IntlProvider>
  )
}
