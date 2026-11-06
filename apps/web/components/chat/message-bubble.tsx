'use client'

import {useMessage} from '@noalhub/i18n/use-message'
import {useTranslations} from 'next-intl'

import {Button} from '@noalhub/ui/button'
import {ChatBubble} from '@noalhub/ui/chat/chat-bubble'
import {Spinner} from '@noalhub/ui/spinner'
import {MessageBody} from './message-body'
import {ReadReceipt} from './read-receipt'
import {useChatFormat} from './use-chat-format'
import {ackErrorText} from '@noalhub/core/chat/error-message'
import type {ConversationMember, Message} from '@noalhub/api/chat'
import {Typography} from '@noalhub/ui/typography'

export function MessageBubble({
  message,
  mine,
  members,
  currentUserId,
  onRetry,
}: {
  message: Message
  mine: boolean
  members: ConversationMember[]
  currentUserId: string | null
  onRetry: (message: Message) => void
}) {
  const t = useTranslations('web.chat.messages')
  const m = useMessage()
  const cf = useChatFormat()
  const failed = message.status === 'failed'
  const sending = message.status === 'sending'

  return (
    <ChatBubble
      mine={mine}
      time={cf.messageTime(message.createdAt)}
      dateTime={message.createdAt}
      pending={sending}
      failed={failed}
      meta={
        <>
          {sending ? <Spinner className="size-3" /> : null}
          {mine && message.status === 'sent' ? (
            <ReadReceipt
              messageId={message.id}
              members={members}
              currentUserId={currentUserId}
            />
          ) : null}
        </>
      }
      error={
        failed ? (
          <>
            <Typography
              as="span"
              variant="body-4"
              role="alert"
              className="text-danger">
              {m(ackErrorText(message.errorCode))}
            </Typography>
            {/* A resend uses the SAME `id` — the backend is idempotent on id, so a
                retry never creates a second message. */}
            <Button
              variant="link"
              size="inline"
              onClick={() => onRetry(message)}>
              {t('resend')}
            </Button>
          </>
        ) : null
      }>
      <MessageBody body={message.body} />
    </ChatBubble>
  )
}
