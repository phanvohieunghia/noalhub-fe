'use client'

import {useTranslations} from 'next-intl'

import {UnreadBadge as UnreadBadgeView} from '@noalhub/ui/chat/unread-badge'

export function UnreadBadge({count}: {count: number}) {
  const t = useTranslations('web.chat.sidebar')

  return <UnreadBadgeView count={count} label={t('unread', {count})} />
}
