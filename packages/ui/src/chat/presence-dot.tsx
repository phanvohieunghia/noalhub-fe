/**
 * The status dot. TWO states, online and offline — the product treats "we have
 * not heard from them" and "they are away" as the same thing, so there is no
 * third dot.
 *
 * Color alone communicates nothing → the label always ships as `title` +
 * `sr-only` text. The label is passed in because deciding it (last seen, …)
 * needs the app's presence store.
 */
export function PresenceDot({
  online,
  label,
  className = '',
}: {
  online: boolean
  label: string
  className?: string
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        title={label}
        className={`ring-background size-2.5 rounded-full ring-2 ${
          online ? 'bg-success' : 'bg-muted-foreground'
        }`}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
