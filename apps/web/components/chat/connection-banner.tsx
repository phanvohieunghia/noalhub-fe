'use client'

import {useTranslations} from 'next-intl'

import {ConnectionBanner as ConnectionBannerView} from '@noalhub/ui/chat/connection-banner'
import {useChatRealtime} from './chat-realtime-provider'

/** Shown only while the socket is NOT online. */
export function ConnectionBanner() {
  const t = useTranslations('web.chat.connection')
  const tc = useTranslations('common')
  const {status, reconnect} = useChatRealtime()
  if (status === 'online') return null

  const connecting = status === 'connecting'

  return (
    <ConnectionBannerView
      connecting={connecting}
      label={connecting ? t('reconnecting') : t('offline')}
      retryLabel={tc('actions.retry')}
      onRetry={reconnect}
    />
  )
}
