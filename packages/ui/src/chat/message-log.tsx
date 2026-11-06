/**
 * The scrollable history frame.
 *
 * `role="log"` + `aria-live="polite"` + `aria-relevant="additions"`: a screen
 * reader announces new messages without interrupting the user mid-typing.
 * `tabIndex={0}` makes the scroll region reachable by keyboard.
 */
export const MessageLog = function MessageLog({
  label,
  children,
  ref,
  ...props
}: Omit<React.ComponentPropsWithRef<'div'>, 'role' | 'aria-label'> & {
  label: string
}) {
  return (
    <div
      {...props}
      ref={ref}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label={label}
      tabIndex={0}
      className="flex-1 overflow-y-auto px-4 py-3">
      {children}
    </div>
  )
}
