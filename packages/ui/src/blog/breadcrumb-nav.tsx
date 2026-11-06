import {Typography} from '../typography'
import type {LinkLike} from './link-like'

export type Crumb = {label: string; href?: string}

/**
 * The visible breadcrumb trail. The last item (no `href`) is the current page —
 * it does not link to itself, and carries `aria-current="page"`.
 */
export function BreadcrumbNav({
  Link,
  label,
  items,
}: {
  Link: LinkLike
  label: string
  items: Crumb[]
}) {
  return (
    <nav aria-label={label} className="text-body-3 opacity-70">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 ? (
              <Typography as="span" variant="body-3" aria-hidden>
                /
              </Typography>
            ) : null}
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <Typography as="span" variant="body-3" aria-current="page">
                {item.label}
              </Typography>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
