import {Icon, ICONS} from '@noalhub/ui/icons'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

/**
 * A page's `<h1>`. The description, when there is one, sits behind an info
 * icon rather than taking a line under the title.
 */
export function AdminPageTitle({
  title,
  hint,
}: {
  title: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Typography variant="h4" as="h1">
        {title}
      </Typography>
      {hint ? (
        <Tooltip label={hint} side="bottom">
          <button
            type="button"
            aria-label={hint}
            className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <Icon icon={ICONS.info} className="size-4" />
          </button>
        </Tooltip>
      ) : null}
    </div>
  )
}
