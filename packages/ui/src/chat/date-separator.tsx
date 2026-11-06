import {Typography} from '../typography'

/** "Today" / "Yesterday" / "3 July" between two runs of messages. */
export function DateSeparator({label}: {label: string}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="bg-border h-px flex-1" />
      <Typography variant="body-4" as="span" className="text-muted-foreground">
        {label}
      </Typography>
      <span className="bg-border h-px flex-1" />
    </div>
  )
}
