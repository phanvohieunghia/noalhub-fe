import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

import {QaItemEditContent} from '@/components/qa/qa-item-editor-pages'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.qa')
  return {title: t('form.editTitle')}
}

/**
 * The backend has no "get one question" endpoint, so the page loads the set the
 * question lives in and picks it out — which is why the set id is part of the
 * path, not a query string: a question is always addressed through its set.
 */
export default async function QaItemEditPage({
  params,
}: PageProps<'/qa/sets/[id]/items/[itemId]'>) {
  const {id, itemId} = await params

  return (
    <IntlProvider namespace="admin.qa">
      <QaItemEditContent setId={id} itemId={itemId} />
    </IntlProvider>
  )
}
