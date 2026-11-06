'use client'

import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useTranslations} from 'next-intl'

import {ConversationRow} from '@noalhub/ui/chat/conversation-row'
import {PresenceDot} from './presence-dot'
import {UnreadBadge} from './unread-badge'
import {useChatFormat} from './use-chat-format'
import {useAuthStore} from '@noalhub/api/auth'
import {otherMember} from '@noalhub/core/chat/format'
import type {Conversation} from '@noalhub/api/chat'

export function ConversationListItem({
  conversation,
  active,
}: {
  conversation: Conversation
  active: boolean
}) {
  const t = useTranslations('web.chat.sidebar')
  const cf = useChatFormat()
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)
  const name = cf.conversationName(conversation, currentUserId)
  const peer = otherMember(conversation, currentUserId)
  const last = conversation.lastMessage

  // A "You: …" prefix distinguishes your own messages without opening the conversation.
  const preview = !last
    ? t('noMessages')
    : last.senderId === currentUserId
      ? t('youPrefix', {body: last.body})
      : last.body

  return (
    <ConversationRow
      active={active}
      name={name}
      avatarUrl={peer?.avatarUrl}
      time={cf.conversationTimestamp(last?.createdAt ?? null)}
      preview={preview}
      presence={
        conversation.type === 'direct' ? (
          <PresenceDot userId={peer?.userId} />
        ) : null
      }
      unread={
        conversation.unreadCount > 0 ? (
          <UnreadBadge count={conversation.unreadCount} />
        ) : null
      }
      link={({children, ...props}) => (
        <Link href={routes.chatConversation(conversation.id)} {...props}>
          {children}
        </Link>
      )}
    />
  )
}
