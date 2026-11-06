'use client'

import {useTranslations} from 'next-intl'

import {MessageGroup as MessageGroupView} from '@noalhub/ui/chat/message-group'
import {MessageBubble} from './message-bubble'
import type {ConversationMember, Message} from '@noalhub/api/chat'

/**
 * A run of consecutive messages from one person: the avatar and name appear
 * once.
 *
 * A `Message` carries only `senderId` — names and avatars have to be looked up
 * in the conversation's `members`, so that map is passed down from `ChatPane`
 * (never let each bubble `find()` through the array itself).
 */
export function MessageGroup({
  messages,
  senderId,
  members,
  currentUserId,
  onRetry,
}: {
  messages: Message[]
  senderId: string | null
  members: Map<string, ConversationMember>
  currentUserId: string | null
  onRetry: (message: Message) => void
}) {
  const t = useTranslations('web.chat.messages')
  const mine = senderId !== null && senderId === currentUserId
  const sender = senderId ? members.get(senderId) : undefined

  // A null senderId means the sender was deleted from the system (ON DELETE SET NULL).
  const name =
    senderId === null
      ? t('deletedUser')
      : (sender?.displayName ?? t('unknownUser'))

  const memberList = [...members.values()]

  return (
    <MessageGroupView
      mine={mine}
      name={name}
      avatarUrl={sender?.avatarUrl}
      italicName={senderId === null}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          mine={mine}
          members={memberList}
          currentUserId={currentUserId}
          onRetry={onRetry}
        />
      ))}
    </MessageGroupView>
  )
}
