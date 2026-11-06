import {Typography} from '../typography'

/** `✓` sent · `✓✓` read; `label` is the `sr-only` text for the current state. */
export function ReadReceipt({read, label}: {read: boolean; label: string}) {
  return (
    <Typography as="span" variant="body-4" className="leading-none opacity-70">
      <span aria-hidden>{read ? '✓✓' : '✓'}</span>
      <span className="sr-only">{label}</span>
    </Typography>
  )
}
