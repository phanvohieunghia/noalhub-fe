import {Children} from 'react'

import {Typography} from '../typography'

/**
 * The post grid, **plus an empty state with words in it**. An empty list is still
 * a 200, never a 404: having no posts yet is a valid temporary state of the
 * site. Only a category or tag that does not exist calls `notFound()` (§6.5).
 */
export function PostGrid({
  emptyMessage,
  children,
  layout = 'grid',
}: {
  emptyMessage: string
  children: React.ReactNode
  /** `rows` stacks cards in one readable column (the `row` card variant). */
  layout?: 'grid' | 'rows'
}) {
  if (Children.count(children) === 0) {
    return (
      <Typography
        variant="body-3"
        className="border-border rounded-lg border border-dashed px-4 py-12 text-center opacity-60">
        {emptyMessage}
      </Typography>
    )
  }

  if (layout === 'rows') {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-12 md:gap-14">
        {children}
      </div>
    )
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  )
}
