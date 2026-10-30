'use client'

import Link from 'next/link'

import {HoverFlyout} from './hover-flyout'
import {Icon, ICONS} from './icons'
import {Logo} from './logo'
import {Tooltip} from './tooltip'
import {Typography} from './typography'

export type SidebarItem = {
  href: string
  /** Already translated — the component pins no i18n namespace. */
  label: string
  /** An iconify name for top-level rows. Children are drawn without one. */
  icon?: string
  /** Shown but unusable. */
  locked?: boolean
  /** Why it is locked, shown as a tooltip. */
  lockedReason?: string
  /** Sub-screens, indented under the row. One level only. */
  children?: SidebarItem[]
}

export type SidebarLabels = {
  /** Accessible name of the `<nav>` landmark. */
  nav: string
  expandSidebar: string
  collapseSidebar: string
  /** Name of a group's chevron button; `open` is its current state. */
  group: (open: boolean, section: string) => string
}

export type SidebarProps = {
  brand: {title: string; subtitle: string}
  items: SidebarItem[]
  pathname: string
  /** The href of the row that is current, or undefined. */
  activeHref?: string
  /** Hrefs of the groups the user collapsed. */
  collapsedGroups: string[]
  onToggleGroup: (href: string) => void
  /** Icon-only mode. */
  rail: boolean
  onToggleRail: () => void
  labels: SidebarLabels
  className?: string
}

/**
 * A collapsible navigation sidebar with grouped rows and an icon-rail mode.
 * Purely presentational: the caller owns the state (active row, collapsed groups,
 * rail) and the translations. The admin app wires it to `localStorage` and `/auth/me`.
 */
export function Sidebar({
  brand,
  items,
  pathname,
  activeHref,
  collapsedGroups,
  onToggleGroup,
  rail,
  onToggleRail,
  labels,
  className = '',
}: SidebarProps) {
  return (
    <aside
      className={`group/sidebar relative flex shrink-0 flex-col gap-1 border-r border-border px-3 py-4 transition-[width] duration-200 ${
        rail ? 'w-16' : 'w-62'
      } ${className}`}>
      <div
        className={
          rail
            ? 'flex flex-col items-center gap-2 pt-1 pb-3'
            : 'flex items-center gap-2.5 px-2 pt-1 pb-4'
        }>
        <Logo className="size-8 shrink-0" />
        {rail ? null : (
          <div className="min-w-0 flex-1 whitespace-nowrap">
            <Typography variant="title-3" as="p" className="leading-snug">
              {brand.title}
            </Typography>
            <Typography
              variant="body-4"
              as="p"
              className="text-muted-foreground">
              {brand.subtitle}
            </Typography>
          </div>
        )}
      </div>
      {/*
       * Straddles the right edge so it reads as the handle that moves the edge itself.
       * It appears only when the pointer comes near the button — the stretch of edge
       * beside the logo — or the button holds focus, not whenever the sidebar is hovered. Touch screens have no hover, so
       * there it stays visible. The outer strip is the hover zone, the middle div
       * places the button, the inner one animates — they cannot share a transform.
       */}
      <div className="group/edge absolute top-0 right-0 z-10 h-18 w-8 translate-x-1/2">
        <div className="absolute top-7 left-1/2 -translate-x-1/2">
          <div className="scale-50 opacity-0 transition-[opacity,scale] duration-200 ease-out group-focus-within/edge:scale-100 group-focus-within/edge:opacity-100 group-hover/edge:scale-100 group-hover/edge:opacity-100 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100">
            <Tooltip
              label={rail ? labels.expandSidebar : labels.collapseSidebar}
              side="right">
              <button
                type="button"
                onClick={onToggleRail}
                aria-expanded={!rail}
                aria-label={
                  rail ? labels.expandSidebar : labels.collapseSidebar
                }
                className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Icon
                  icon={rail ? ICONS.chevronRight : ICONS.chevronLeft}
                  animate="snappy"
                  className="size-3.5"
                  strokeWidth={3}
                />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      <div role="separator" className="h-px w-full bg-border" />
      <nav aria-label={labels.nav} className="mt-2 flex flex-col gap-0.5">
        {items.map((item) => (
          <SidebarEntry
            key={item.href}
            item={item}
            activeHref={activeHref}
            pathname={pathname}
            collapsedGroups={collapsedGroups}
            onToggleGroup={onToggleGroup}
            labels={labels}
            rail={rail}
          />
        ))}
      </nav>
    </aside>
  )
}

function SidebarEntry({
  item,
  activeHref,
  pathname,
  collapsedGroups,
  onToggleGroup,
  labels,
  rail = false,
}: {
  item: SidebarItem
  activeHref: string | undefined
  pathname: string
  collapsedGroups: string[]
  onToggleGroup: (href: string) => void
  labels: SidebarLabels
  /** Icon-only: no label, no chevron, and a group's children are not drawn. */
  rail?: boolean
}) {
  const locked = Boolean(item.locked)

  // Top-level rows carry an icon; the indented children are text only.
  const icon = item.icon ? (
    <Icon icon={item.icon} className="size-5 shrink-0" />
  ) : null
  const rowPadding = item.icon ? 'px-3 py-[9px]' : 'px-3 py-[7px]'

  if (rail) {
    // A rail has no room for children, so the group's icon stands for the whole
    // section: it lights up when the current page is the group or any child.
    const railActive =
      item.href === activeHref ||
      item.children?.some((child) => child.href === activeHref)
    const railRow = `flex items-center justify-center rounded-md py-2.5 transition-colors ${
      railActive ? 'bg-muted' : 'hover:bg-muted/60'
    }`

    if (locked) {
      return (
        <Tooltip
          label={
            item.lockedReason
              ? `${item.label} — ${item.lockedReason}`
              : item.label
          }
          side="right">
          <span
            // `aria-label` is only allowed on an element with a role; a disabled
            // link is `role="link"` + `aria-disabled`.
            role="link"
            aria-disabled="true"
            aria-label={item.label}
            className="flex cursor-not-allowed items-center justify-center rounded-md py-2.5 text-muted-foreground">
            {icon}
          </span>
        </Tooltip>
      )
    }

    const railLink = (
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={item.href === activeHref ? 'page' : undefined}
        className={railRow}>
        {icon}
      </Link>
    )

    const visibleChildren = item.children ?? []

    // No children: the label tooltip is enough.
    if (!visibleChildren.length) {
      return (
        <Tooltip label={item.label} side="right">
          {railLink}
        </Tooltip>
      )
    }

    // A group: hovering (or focusing) the icon opens a flyout with the children,
    // since the rail has no room to draw them inline. Clicking the icon still
    // goes to the group's own page.
    return (
      <HoverFlyout label={item.label} trigger={railLink}>
        <ul className="flex flex-col gap-0.5">
          {visibleChildren.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                aria-current={child.href === activeHref ? 'page' : undefined}
                className={`block rounded-md px-3 py-[7px] text-body-3 transition-colors ${
                  child.href === activeHref
                    ? 'bg-muted font-semibold'
                    : 'hover:bg-muted/60'
                }`}>
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </HoverFlyout>
    )
  }

  if (locked) {
    return (
      <span
        title={item.lockedReason}
        aria-disabled="true"
        className={`flex cursor-not-allowed items-center gap-3 rounded-md text-body-3 text-muted-foreground ${rowPadding}`}>
        {icon}
        {item.label}
      </span>
    )
  }

  const isActive = item.href === activeHref
  const rowTone = isActive ? 'bg-muted font-semibold' : 'hover:bg-muted/60'
  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-md text-body-3 transition-colors ${rowPadding} ${
        item.children?.length ? '' : rowTone
      }`}>
      {icon}
      <Typography
        variant="body-3"
        as="span"
        className="min-w-0 flex-1 truncate">
        {item.label}
      </Typography>
    </Link>
  )

  if (!item.children?.length) return link

  /*
   * A collapsed group whose child IS the current screen stays open regardless:
   * hiding the row that is highlighted right now would leave the sidebar
   * disagreeing with the page, and the user cannot see where they are.
   */
  const holdsCurrentPage = pathname.startsWith(`${item.href}/`)
  const isOpen = holdsCurrentPage || !collapsedGroups.includes(item.href)
  const groupId = `nav-group-${item.href.replace(/\W+/g, '-')}`

  return (
    <div>
      {/*
       * One row, two targets: the label is still a plain link and the chevron
       * at the right edge is its own button. Making the whole row toggle would
       * cost the one-click path to the group's page, and a row that both
       * navigates and expands does neither predictably.
       */}
      <div
        className={`flex items-center rounded-md transition-colors ${rowTone}`}>
        {link}
        <button
          type="button"
          onClick={() => onToggleGroup(item.href)}
          aria-expanded={isOpen}
          aria-controls={groupId}
          aria-label={labels.group(isOpen, item.label)}
          disabled={holdsCurrentPage}
          className="mr-2 grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
          <Icon
            icon={isOpen ? ICONS.chevronDown : ICONS.chevronRight}
            animate="snappy"
            className="size-4"
          />
        </button>
      </div>

      {/*
       * Height animates through a 0fr -> 1fr grid row, which (unlike `height`)
       * can transition to the content's natural size. `inert` keeps the closed
       * links out of the tab order and the accessibility tree while collapsed.
       */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}>
        <div className="min-h-0 overflow-hidden">
          <div className="pt-0.5 pb-1">
            {/* The nested <ul> is what tells a screen reader these belong to the section above. */}
            <ul
              id={groupId}
              inert={!isOpen}
              className="ml-[22px] flex flex-col gap-0.5 border-l border-border pl-2.5">
              {item.children.map((child) => (
                <li key={child.href}>
                  <SidebarEntry
                    item={child}
                    activeHref={activeHref}
                    pathname={pathname}
                    collapsedGroups={collapsedGroups}
                    onToggleGroup={onToggleGroup}
                    labels={labels}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
