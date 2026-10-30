'use client'

import {useTranslations} from 'next-intl'

import type {ConversationMember} from '@noalhub/api/chat'
import {Typography} from '@noalhub/ui/typography'

/**
 * `✓` sent · `✓✓` read by someone.
 *
 * The backend returns no per-message "read" flag — it returns each member's
 * `lastReadMessageId`. The comparison works because ids are UUID v7
 * (chronologically ordered): this message is read when someone else's cursor is
 * >= its id.
 */
export function ReadReceipt({
  messageId,
  members,
  currentUserId,
}: {
  messageId: string
  members: ConversationMember[]
  currentUserId: string | null
}) {
  const t = useTranslations('web.chat.messages')
  const readByOther = members.some(
    (member) =>
      member.userId !== currentUserId &&
      member.lastReadMessageId !== null &&
      member.lastReadMessageId.localeCompare(messageId) >= 0,
  )

  return (
    <Typography as="span" variant="body-4" className="leading-none opacity-70">
      <span aria-hidden>{readByOther ? '✓✓' : '✓'}</span>
      <span className="sr-only">{t(readByOther ? 'read' : 'sent')}</span>
    </Typography>
  )
}
