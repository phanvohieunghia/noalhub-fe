'use client'

import {useTranslations} from 'next-intl'

import {ConversationSearch as ConversationSearchView} from '@noalhub/ui/chat/conversation-search'

/**
 * CLIENT-SIDE filtering of what is already loaded — the backend has no
 * conversation search endpoint. That means it cannot find a conversation on a
 * page not yet fetched; a known limitation, not a bug.
 */
export function ConversationSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const t = useTranslations('web.chat.sidebar')

  return (
    <ConversationSearchView
      value={value}
      onChange={onChange}
      placeholder={t('searchPlaceholder')}
      label={t('searchLabel')}
    />
  )
}
