'use client'

import {useRef, useState} from 'react'

import {MessageComposerView} from '@noalhub/ui/chat/message-composer-view'
import {useChatRealtime} from './chat-realtime-provider'
import {MESSAGE_BODY_MAX} from '@noalhub/api/chat'
import {useTranslations} from 'next-intl'
import {useSendMessage, useTyping} from '@noalhub/api/chat'

export function MessageComposer({conversationId}: {conversationId: string}) {
  const t = useTranslations('web.chat.composer')
  const tc = useTranslations('web.chat.connection')
  const [body, setBody] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const {status} = useChatRealtime()
  const {mutate: send, isPending} = useSendMessage(conversationId)
  const {start: startTyping, stop: stopTyping} = useTyping(conversationId)

  const offline = status !== 'online'
  const trimmed = body.trim()
  const tooLong = trimmed.length > MESSAGE_BODY_MAX
  const canSend = trimmed.length > 0 && !tooLong && !offline

  function submit() {
    if (!canSend) return

    // Clear the composer IMMEDIATELY, without waiting for the ack — the message
    // is already in the cache optimistically and has a retry button on failure,
    // so nothing can be lost.
    setBody('')
    stopTyping()
    const node = textareaRef.current
    if (node) node.style.height = 'auto'

    send({body: trimmed})
  }

  return (
    <MessageComposerView
      textareaRef={textareaRef}
      value={body}
      label={t('label')}
      placeholder={offline ? t('placeholderOffline') : t('placeholder')}
      sendLabel={t('send')}
      offlineNotice={offline ? tc('composerOffline') : undefined}
      error={
        tooLong
          ? t('tooLong', {max: MESSAGE_BODY_MAX, length: trimmed.length})
          : undefined
      }
      canSend={canSend}
      pending={isPending}
      onSubmit={submit}
      // Do NOT disable the textarea while offline: being locked out mid-typing
      // is awful. Only the send button is blocked, and the text is kept.
      onChange={(event) => {
        setBody(event.target.value)
        if (event.target.value.trim()) startTyping()
      }}
      onBlur={stopTyping}
      onKeyDown={(event) => {
        // Enter sends, Shift+Enter adds a line. Skipped while an IME is
        // composing, or Vietnamese gets sent mid-diacritic.
        if (
          event.key === 'Enter' &&
          !event.shiftKey &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault()
          submit()
        }
      }}
    />
  )
}
