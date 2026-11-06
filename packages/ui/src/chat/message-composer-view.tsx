import {Button} from '../button'
import {Icon, ICONS} from '../icons'
import {Spinner} from '../spinner'
import {Typography} from '../typography'

/**
 * The composer's markup, with no state: the app owns the draft, the socket and
 * the typing signal.
 *
 * The textarea is deliberately NOT disabled while offline — being locked out
 * mid-sentence is awful, so only the send button is blocked and the text kept.
 * Icon-only send button → the label moves to `aria-label`.
 */
export function MessageComposerView({
  textareaRef,
  value,
  onChange,
  onBlur,
  onKeyDown,
  onSubmit,
  label,
  placeholder,
  sendLabel,
  offlineNotice,
  error,
  canSend,
  pending = false,
}: {
  textareaRef?: React.Ref<HTMLTextAreaElement>
  value?: string
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>
  onSubmit?: () => void
  label: string
  placeholder: string
  sendLabel: string
  /** Explains why sending is blocked; shown above the input row. */
  offlineNotice?: string
  error?: string
  canSend: boolean
  pending?: boolean
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
      noValidate
      className="border-border shrink-0 border-t p-3">
      {offlineNotice ? (
        <Typography
          variant="body-4"
          role="status"
          className="px-1 pb-1 opacity-60">
          {offlineNotice}
        </Typography>
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onInput={(event) => {
            // Grows to `max-h-40` then scrolls. Touching the style directly:
            // remeasuring a height is the DOM's job, not state's.
            const node = event.currentTarget
            node.style.height = 'auto'
            node.style.height = `${node.scrollHeight}px`
          }}
          aria-label={label}
          placeholder={placeholder}
          className="border-border text-body-3 focus:border-foreground/60 max-h-40 flex-1 resize-none rounded-md border bg-transparent px-3 py-2 outline-none"
        />
        {/* A real `type="submit"` so the form sends from the keyboard too. */}
        <Button
          type="submit"
          size="icon"
          aria-label={sendLabel}
          disabled={!canSend}
          className="shrink-0">
          {pending ? (
            <Spinner className="size-4" />
          ) : (
            <Icon icon={ICONS.send} />
          )}
        </Button>
      </div>

      {error ? (
        <Typography
          variant="body-4"
          role="alert"
          className="text-danger px-1 pt-1">
          {error}
        </Typography>
      ) : null}
    </form>
  )
}
