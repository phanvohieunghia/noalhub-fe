import {Typography} from '../typography'

/**
 * One message: the bubble, its time/meta row and — when sending failed — the
 * error row.
 *
 * `pending` is drawn as a dashed OUTLINE rather than a faded fill: fading text
 * on `--foreground` lands under the 4.5:1 WCAG AA threshold.
 */
export function ChatBubble({
  mine,
  time,
  dateTime,
  meta,
  error,
  pending = false,
  failed = false,
  children,
}: {
  mine: boolean
  time: string
  dateTime?: string
  /** Receipt / spinner shown beside the time. */
  meta?: React.ReactNode
  /** The failed-send row: the error message and the resend button. */
  error?: React.ReactNode
  pending?: boolean
  failed?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <Typography
        as="div"
        variant="body-3"
        className={`max-w-[min(32rem,80%)] rounded-2xl px-3 py-2 ${
          pending
            ? 'border-foreground text-foreground border border-dashed'
            : mine
              ? 'bg-foreground text-background'
              : 'bg-muted text-foreground'
        } ${failed ? 'ring-danger ring-1' : ''}`}>
        {children}
      </Typography>

      <div className="mt-0.5 flex items-center gap-1.5 px-1 opacity-60">
        <Typography as="time" variant="body-4" dateTime={dateTime}>
          {time}
        </Typography>
        {meta}
      </div>

      {error ? (
        <div className="mt-0.5 flex items-center gap-2 px-1">{error}</div>
      ) : null}
    </div>
  )
}
