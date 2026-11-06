'use client'

import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {Button} from '@noalhub/ui/button'
import {Avatar} from '@noalhub/ui/avatar'
import {ChatHeaderBar} from '@noalhub/ui/chat/chat-header-bar'
import {MemberProfileDrawer} from './member-profile-drawer'
import {PresenceDot, PresenceLabel} from './presence-dot'
import {useChatFormat} from './use-chat-format'
import {useAuthStore} from '@noalhub/api/auth'
import {otherMember} from '@noalhub/core/chat/format'
import type {Conversation} from '@noalhub/api/chat'
import {Typography} from '@noalhub/ui/typography'

export function ChatHeader({conversation}: {conversation: Conversation}) {
  const t = useTranslations('web.chat.header')
  const cf = useChatFormat()
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)
  const name = cf.conversationName(conversation, currentUserId)
  const peer = otherMember(conversation, currentUserId)
  const isDirect = conversation.type === 'direct'
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <ChatHeaderBar
        name={name}
        back={
          // The back button only means anything on mobile — desktop always shows the sidebar.
          <Link
            href={routes.chat}
            aria-label={t('backToList')}
            className="text-title-2 -ml-1 rounded-md px-1 py-0.5 leading-none opacity-70 hover:opacity-100 md:hidden">
            ◀
          </Link>
        }
        avatar={
          // The avatar opens the profile; a group has no single "other person", so it is just an image.
          peer ? (
            <Button
              variant="ghost"
              shape="circle"
              onClick={() => setProfileOpen(true)}
              aria-label={t('viewProfile', {name})}
              className="relative size-auto shrink-0 p-0 hover:bg-transparent">
              <Avatar name={name} src={peer.avatarUrl} size="sm" />
              {isDirect ? (
                <PresenceDot
                  userId={peer.userId}
                  className="absolute -right-0.5 -bottom-0.5"
                />
              ) : null}
            </Button>
          ) : (
            <span className="relative shrink-0">
              <Avatar name={name} src={null} size="sm" />
            </span>
          )
        }
        status={
          isDirect ? (
            <PresenceLabel userId={peer?.userId} />
          ) : (
            <Typography
              variant="body-4"
              as="span"
              className="text-muted-foreground">
              {t('memberCount', {count: conversation.members.length})}
            </Typography>
          )
        }
      />

      {peer ? (
        <MemberProfileDrawer
          member={peer}
          name={name}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </>
  )
}
