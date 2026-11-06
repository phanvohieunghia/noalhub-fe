import type {LinkLike} from './link-like'

export type CategoryFilterItem = {
  href: string
  label: string
  current?: boolean
}

/**
 * The row of category pills above a listing: "All" plus every category, with the
 * current one filled. A plain list of links, not tabs — each one is a real page
 * (the category page is the one axis that gets indexed, `docs/blog.md` §2.6), so
 * the current one is `aria-current="page"` rather than a selected tab.
 */
export function CategoryFilter({
  Link,
  label,
  items,
}: {
  Link: LinkLike
  label: string
  items: CategoryFilterItem[]
}) {
  if (items.length <= 1) return null

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={`text-body-3 inline-flex rounded-full border px-3.5 py-1.5 transition-colors ${
                item.current
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
