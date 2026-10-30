import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

import {QaItemCreateContent} from '@/components/qa/qa-item-editor-pages'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.qa')
  return {title: t('form.createTitle')}
}

export default async function QaItemNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const {set} = await searchParams

  return (
    <IntlProvider namespace="admin.qa">
      <QaItemCreateContent
        initialSetId={typeof set === 'string' ? set : undefined}
      />
    </IntlProvider>
  )
}
