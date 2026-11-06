import {Typography} from '../typography'

/**
 * The header of an open conversation: back button, avatar (with its presence
 * dot), name and a status line. The name is a `<span>`, not a heading — the only
 * `h1` on the chat screen is the sidebar title.
 *
 * `back` and `avatar` are slots because both are interactive in the app (a
 * locale-aware link, a button opening the profile drawer).
 */
export function ChatHeaderBar({
  back,
  avatar,
  name,
  status,
  as: Root = 'div',
}: {
  /** Only means anything on mobile — desktop always shows the sidebar. */
  back?: React.ReactNode
  avatar: React.ReactNode
  name: string
  status?: React.ReactNode
  /** `header` when the page has exactly one chat header. */
  as?: 'div' | 'header'
}) {
  return (
    <Root className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-3">
      {back}
      {avatar}
      <div className="flex min-w-0 flex-col">
        <Typography
          variant="title-4"
          weight={600}
          as="span"
          className="truncate">
          {name}
        </Typography>
        {status}
      </div>
    </Root>
  )
}
