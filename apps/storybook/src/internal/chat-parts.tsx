import {useTranslations} from 'next-intl'

import {Avatar} from '@noalhub/ui/avatar'
import {ChatBubble} from '@noalhub/ui/chat/chat-bubble'
import {ChatHeaderBar} from '@noalhub/ui/chat/chat-header-bar'
import {ConnectionBanner as ConnectionBannerView} from '@noalhub/ui/chat/connection-banner'
import {ConversationRow} from '@noalhub/ui/chat/conversation-row'
import {ConversationSearch} from '@noalhub/ui/chat/conversation-search'
import {DateSeparator as DateSeparatorView} from '@noalhub/ui/chat/date-separator'
import {MessageComposerView} from '@noalhub/ui/chat/message-composer-view'
import {MessageGroup as MessageGroupView} from '@noalhub/ui/chat/message-group'
import {MessageLog} from '@noalhub/ui/chat/message-log'
import {PresenceDot as PresenceDotView} from '@noalhub/ui/chat/presence-dot'
import {ReadReceipt as ReadReceiptView} from '@noalhub/ui/chat/read-receipt'
import {UnreadBadge} from '@noalhub/ui/chat/unread-badge'
import {Typography} from '@noalhub/ui/typography'

/*
 * The pieces the chat and presence flows both draw, kept out of either stories
 * file so the two can be read separately.
 *
 * Not a `*.stories.tsx`, so Storybook never indexes it — and it lives in
 * `src/internal/` for the same reason the flows do: the public build leaves that
 * directory out entirely (`.storybook/main.ts`).
 *
 * Every visual here is the REAL component from `@noalhub/ui/chat/*` — the same
 * one `apps/web/components/chat/*` renders. What is left in this file is only
 * what the app gets from its data layer (`useChatFormat`, the presence store, the
 * socket): sample people, and the copy read from the same `web.chat` messages so
 * the locale toolbar switches these exactly like the app. Do not redraw a
 * component here — when one drifts from the app, this is how it goes stale.
 */

export type PresenceState = 'online' | 'offline'

/** The status dot, with its label already decided (the app derives it from the presence store). */
export function PresenceDot({
  state,
  label,
  className = '',
}: {
  state: PresenceState
  label: string
  className?: string
}) {
  return (
    <PresenceDotView
      online={state === 'online'}
      label={label}
      className={className}
    />
  )
}

/**
 * The frame every chat screen sits in: one card, app-sized.
 *
 * `banner` renders ABOVE the two columns, which is where `ChatLayoutShell` puts
 * `ConnectionBanner` — the whole shell is `flex h-dvh flex-col` with the banner
 * as its first child. Drawing it inside the message pane, as this file used to,
 * puts it on the wrong side of the sidebar.
 */
export function ChatScreen({
  banner,
  children,
  className = '',
}: {
  banner?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`border-border bg-surface flex h-[30rem] w-[min(46rem,90vw)] flex-col overflow-hidden rounded-xl border ${className}`}>
      {banner}
      <div className="flex min-h-0 flex-1">{children}</div>
    </div>
  )
}

/** The connection banner — the top strip of the whole shell, never a per-pane element. */
export function ConnectionBanner({connecting = false}: {connecting?: boolean}) {
  const t = useTranslations('web.chat.connection')
  const tc = useTranslations('common')

  return (
    <ConnectionBannerView
      connecting={connecting}
      label={connecting ? t('reconnecting') : t('offline')}
      retryLabel={tc('actions.retry')}
    />
  )
}

export type Peer = {
  name: string
  presence: PresenceState
  preview: string
  time: string
  unread?: number
}

export const PEERS: Peer[] = [
  {
    name: 'Nguyễn An',
    presence: 'online',
    preview: 'Ok mình xem rồi nhé',
    time: '09:41',
    unread: 2,
  },
  {
    name: 'Trần Bình',
    presence: 'offline',
    preview: 'Gửi lại giúp mình link',
    time: 'Hôm qua',
  },
  {name: 'Lê Chi', presence: 'offline', preview: '', time: '3 Th7'},
]

/** The sidebar list. Presence rides on the avatar of every direct conversation. */
export function ConversationList({activeIndex = 0}: {activeIndex?: number}) {
  const t = useTranslations('web.chat.sidebar')
  const tp = useTranslations('web.chat.presence')

  const presenceLabel = (peer: Peer) =>
    peer.presence === 'online' ? tp('online') : tp('hoursAgo', {hours: 3})

  return (
    // `w-80`, matching `ChatLayoutShell`'s `md:w-80`.
    <aside className="border-border flex w-80 shrink-0 flex-col border-r">
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        {/* No "New" button: creating a DM needs a user search the backend does not have yet (`docs/chat.md` §0 #2). */}
        <Typography variant="h6" as="h1">
          {t('title')}
        </Typography>
      </div>

      <ConversationSearch
        placeholder={t('searchPlaceholder')}
        label={t('searchLabel')}
      />

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        {PEERS.map((peer, index) => (
          <ConversationRow
            key={peer.name}
            active={index === activeIndex}
            name={peer.name}
            time={peer.time}
            preview={peer.preview || t('noMessages')}
            presence={
              <PresenceDot
                state={peer.presence}
                label={presenceLabel(peer)}
              />
            }
            unread={
              peer.unread ? (
                <UnreadBadge
                  count={peer.unread}
                  label={t('unread', {count: peer.unread})}
                />
              ) : null
            }
            link={({children, ...props}) => (
              <a href="#" {...props}>
                {children}
              </a>
            )}
          />
        ))}
      </ul>
    </aside>
  )
}

/**
 * The header of an open conversation: back button, avatar with its presence dot,
 * name, and the presence LABEL.
 */
export function ConversationHeader({
  peer = PEERS[0]!,
  statusLabel,
  landmark = true,
}: {
  peer?: Peer
  statusLabel?: string
  /**
   * `false` renders a plain `<div>`. In the app there is exactly one chat header
   * on the page; a story that stacks several would otherwise ship several banner
   * landmarks — an a11y error, and CI runs `a11y: { test: "error" }`.
   */
  landmark?: boolean
}) {
  const tp = useTranslations('web.chat.presence')
  const th = useTranslations('web.chat.header')

  const presenceLabel =
    peer.presence === 'online' ? tp('online') : tp('hoursAgo', {hours: 3})

  return (
    <ChatHeaderBar
      as={landmark ? 'header' : 'div'}
      name={peer.name}
      back={
        // `md:hidden`, exactly as the app has it: only meaningful on mobile.
        <span
          aria-label={th('backToList')}
          className="text-title-2 -ml-1 leading-none opacity-70 md:hidden">
          ◀
        </span>
      }
      avatar={
        <span className="relative shrink-0">
          <Avatar name={peer.name} size="sm" />
          <PresenceDot
            state={peer.presence}
            label={presenceLabel}
            className="absolute -right-0.5 -bottom-0.5"
          />
        </span>
      }
      status={
        statusLabel ? (
          <Typography
            variant="body-4"
            as="span"
            className="text-muted-foreground">
            {statusLabel}
          </Typography>
        ) : null
      }
    />
  )
}

export function DateSeparator({label}: {label: string}) {
  return <DateSeparatorView label={label} />
}

export function Bubble({
  mine = false,
  children,
  time,
  meta,
  error,
  pending = false,
  danger = false,
}: {
  mine?: boolean
  children: React.ReactNode
  time: string
  meta?: React.ReactNode
  /** The failed-send row: the error message and the resend button. */
  error?: React.ReactNode
  /** In flight: drawn as an outline, not a faded fill. */
  pending?: boolean
  danger?: boolean
}) {
  return (
    <ChatBubble
      mine={mine}
      time={time}
      dateTime="2026-07-26T09:41:00Z"
      meta={meta}
      error={error}
      pending={pending}
      failed={danger}>
      {children}
    </ChatBubble>
  )
}

/** A run of consecutive messages from one person: avatar and sender name appear ONCE. */
export function MessageGroup({
  peer,
  mine = false,
  children,
}: {
  peer?: Peer
  mine?: boolean
  children: React.ReactNode
}) {
  return (
    <MessageGroupView mine={mine} name={peer?.name ?? ''}>
      {children}
    </MessageGroupView>
  )
}

/** The scrollable history. */
export function MessageList({children}: {children: React.ReactNode}) {
  const t = useTranslations('web.chat.messages')

  return (
    <MessageLog label={t('label')}>
      <div className="flex flex-col gap-3">{children}</div>
    </MessageLog>
  )
}

/** `✓` sent · `✓✓` read — derived from the peer's read cursor, not a per-message flag. */
export function ReadReceipt({read}: {read: boolean}) {
  const t = useTranslations('web.chat.messages')

  return <ReadReceiptView read={read} label={t(read ? 'read' : 'sent')} />
}

export function Composer({
  offline = false,
  pending = false,
}: {
  offline?: boolean
  pending?: boolean
}) {
  const t = useTranslations('web.chat.composer')
  const tc = useTranslations('web.chat.connection')

  return (
    <MessageComposerView
      label={t('label')}
      placeholder={offline ? t('placeholderOffline') : t('placeholder')}
      sendLabel={t('send')}
      offlineNotice={offline ? tc('composerOffline') : undefined}
      canSend={!offline}
      pending={pending}
    />
  )
}
