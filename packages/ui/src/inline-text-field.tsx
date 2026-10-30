'use client'

import {useState} from 'react'

/**
 * A title that reads as plain text and turns into an input on hover / focus, the
 * way a Google Sheets document name does. The box grows with its text.
 *
 * Commits on blur or Enter, reverts on Escape. An unchanged value is never sent.
 * An empty value shows `placeholder` (e.g. "Untitled") and is submitted as `""`;
 * the caller decides what that means (`null`, a default…). If `onSubmit` throws,
 * the field snaps back to `value` — surfacing the error is the caller's job.
 *
 * Labels come in through props so the component pins no app's i18n namespace.
 */
export function InlineTextField({
  value,
  onSubmit,
  placeholder,
  label,
  maxLength = 200,
  className,
}: {
  value: string
  onSubmit: (next: string) => void | Promise<void>
  /** Shown while the field is empty. */
  placeholder: string
  /** Accessible name; the field has no visible label. */
  label: string
  maxLength?: number
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  // Re-sync when the parent's value changes under us (another tab, a refetch) —
  // but only while not editing, or typing would be overwritten.
  const [editing, setEditing] = useState(false)
  if (!editing && draft !== value) setDraft(value)

  const commit = async () => {
    setEditing(false)
    const next = draft.trim()
    if (next === value) {
      setDraft(value)
      return
    }
    try {
      await onSubmit(next)
    } catch {
      setDraft(value)
    }
  }

  return (
    <input
      value={draft}
      placeholder={placeholder}
      aria-label={label}
      maxLength={maxLength}
      onFocus={(event) => {
        setEditing(true)
        event.currentTarget.select()
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
      className={[
        'field-sizing-content min-w-24 max-w-full truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-title-3 text-foreground outline-none transition-colors placeholder:text-foreground hover:border-border focus:border-primary focus:ring-1 focus:ring-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
