import {IntlProvider} from '@noalhub/i18n/provider'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

import {QaFeedbacksContent} from '@/components/qa/qa-feedbacks-content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.qa')
  return {title: t('feedbacks.title')}
}

export default function QaFeedbacksPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <QaFeedbacksContent />
    </IntlProvider>
  )
}
