'use client'

import {DateSeparator as DateSeparatorView} from '@noalhub/ui/chat/date-separator'

import {useChatFormat} from './use-chat-format'

/** "Today" / "Yesterday" / "3 July". */
export function DateSeparator({iso}: {iso: string}) {
  const label = useChatFormat().dayLabel(iso)
  if (!label) return null

  return <DateSeparatorView label={label} />
}
