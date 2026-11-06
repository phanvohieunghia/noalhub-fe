import {Button} from '../button'
import {Spinner} from '../spinner'
import {Typography} from '../typography'

/**
 * The strip across the top of the chat shell while the socket is NOT online.
 * Messages go over the socket, so a lost connection means losing the ability to
 * send — the user has to see that, not guess it.
 *
 * `connecting` swaps the `⚠` for a spinner and drops the retry button: there is
 * nothing to retry while a retry is already in flight.
 */
export function ConnectionBanner({
  connecting = false,
  label,
  retryLabel,
  onRetry,
}: {
  connecting?: boolean
  label: string
  retryLabel: string
  onRetry?: () => void
}) {
  return (
    <div
      role="status"
      className="bg-warning/15 text-warning border-warning/30 flex shrink-0 items-center justify-center gap-3 border-b px-4 py-2">
      {connecting ? (
        <Spinner />
      ) : (
        <Typography as="span" variant="body-3" aria-hidden>
          ⚠
        </Typography>
      )}
      <Typography as="span" variant="body-3">
        {label}
      </Typography>
      {connecting ? null : (
        // `border-current` on purpose: the banner is amber, and a
        // `border-border` button inside it reads as a foreign element.
        <Button
          variant="outline"
          size="xs"
          onClick={onRetry}
          className="border-current/30 hover:bg-current/10">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
