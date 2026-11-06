import {Avatar} from '../avatar'
import {Typography} from '../typography'

/**
 * A run of consecutive messages from one person: the avatar and the sender name
 * appear ONCE, not per bubble. Own messages get neither — the column is reversed
 * and the name would be your own.
 */
export function MessageGroup({
  mine,
  name,
  avatarUrl,
  italicName = false,
  children,
}: {
  mine: boolean
  name: string
  avatarUrl?: string | null
  /** A deleted sender is shown in italics. */
  italicName?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
      {mine ? null : <Avatar name={name} src={avatarUrl} size="sm" />}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {mine ? null : (
          <Typography
            as="span"
            variant="body-4"
            className={`px-1 opacity-60 ${italicName ? 'italic' : ''}`}>
            {name}
          </Typography>
        )}
        {children}
      </div>
    </div>
  )
}
