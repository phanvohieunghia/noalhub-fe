/**
 * The sidebar search box: a bare `<input>` with an `aria-label` — it has no
 * visible label, and a labelled `Input` would make the sidebar a row taller.
 */
export function ConversationSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="shrink-0 px-2 pb-2">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="border-border text-body-3 focus:border-foreground/60 w-full rounded-md border bg-transparent px-3 py-1.5 outline-none"
      />
    </div>
  )
}
