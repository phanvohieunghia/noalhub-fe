import {Typography} from '../typography'

/**
 * The unread-count pill, capped at `99+`. A bare number tells a screen reader
 * nothing → `label` is the full `sr-only` description.
 */
export function UnreadBadge({count, label}: {count: number; label: string}) {
  if (count <= 0) return null

  return (
    <Typography
      as="span"
      variant="body-4"
      weight={600}
      className="bg-foreground text-background inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5">
      <span aria-hidden>{count > 99 ? '99+' : count}</span>
      <span className="sr-only">{label}</span>
    </Typography>
  )
}
