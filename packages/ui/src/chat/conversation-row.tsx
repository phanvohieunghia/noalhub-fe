import {Avatar} from '../avatar'
import {Typography} from '../typography'

/**
 * One row of the sidebar list. `link` is the element that makes the row
 * navigable — the app passes its locale-aware `Link`, a story passes an `<a>` —
 * so this file depends on no router.
 *
 * `aria-current="page"` is how a screen reader knows which item is open; the
 * background alone says nothing.
 */
export function ConversationRow({
  link,
  active,
  name,
  avatarUrl,
  presence,
  time,
  preview,
  unread,
}: {
  link: (props: {
    className: string
    'aria-current'?: 'page'
    children: React.ReactNode
  }) => React.ReactElement
  active: boolean
  name: string
  avatarUrl?: string | null
  /** The presence dot, absolutely positioned by this component. */
  presence?: React.ReactNode
  time: string
  preview: string
  /** `UnreadBadge`, or nothing. */
  unread?: React.ReactNode
}) {
  return (
    <li>
      {link({
        'aria-current': active ? 'page' : undefined,
        className: `flex items-center gap-3 rounded-lg p-2 transition-colors ${
          active ? 'bg-muted' : 'hover:bg-muted/60'
        }`,
        children: (
          <>
            <span className="relative shrink-0">
              <Avatar name={name} src={avatarUrl} />
              {presence ? (
                <span className="absolute -right-0.5 -bottom-0.5">
                  {presence}
                </span>
              ) : null}
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-baseline justify-between gap-2">
                <Typography variant="title-4" as="span" className="truncate">
                  {name}
                </Typography>
                <Typography
                  as="span"
                  variant="body-4"
                  className="text-muted-foreground shrink-0">
                  {time}
                </Typography>
              </span>
              <span className="flex items-center justify-between gap-2">
                <Typography
                  as="span"
                  variant="body-4"
                  weight={unread ? 500 : 400}
                  className={`truncate ${unread ? '' : 'text-muted-foreground'}`}>
                  {preview}
                </Typography>
                {unread}
              </span>
            </span>
          </>
        ),
      })}
    </li>
  )
}
