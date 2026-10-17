"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

import { useMe } from "@noalhub/api/auth";

import { FLAT_NAV_ITEMS, NAV_ITEMS, type NavItem } from "./nav-items";
import { HoverFlyout } from "@noalhub/ui/hover-flyout";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Logo } from "@noalhub/ui/logo";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

const COLLAPSED_KEY = "admin.sidebar.collapsedGroups";
const RAIL_KEY = "admin.sidebar.rail";

/**
 * The href of the nav item the current path belongs to, or `undefined`.
 *
 * Prefix matching alone stops working once items nest: `/posts/slugs` is a
 * prefix hit for BOTH "Posts" and its "Slugs" child, and two lit-up rows read
 * as a bug. The longest match wins — which is also the most specific one.
 */
function activeNavHref(pathname: string): string | undefined {
  let best: string | undefined;

  for (const item of FLAT_NAV_ITEMS) {
    // Requiring the next character to be "/" rules out `/postsomething`.
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.length)) best = item.href;
  }

  return best;
}

/**
 * Which groups the user collapsed, remembered across visits.
 *
 * `useSyncExternalStore` rather than an effect: the server has no
 * `localStorage`, so reading it during render would make the first client render
 * disagree with the HTML. This hook is built for exactly that — React calls
 * `getServerSnapshot` while rendering on the server and switches to the real
 * value after hydration, with no cascading `setState`.
 *
 * The snapshot is the raw string, not a parsed array: `getSnapshot` must return
 * something stable by `Object.is`, and a fresh `JSON.parse` returns a new array
 * every call, which spins React forever.
 *
 * Storing the COLLAPSED set (not the expanded one) keeps the default —
 * everything open — whenever the store is empty or unreadable.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab writing the same key: `storage` fires here but not in the tab
  // that wrote it, which is why `toggle` notifies locally as well.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readCollapsed(): string {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) ?? "";
  } catch {
    // Private mode, or storage blocked. Not worth a broken sidebar.
    return "";
  }
}

function useCollapsedGroups() {
  const raw = useSyncExternalStore(subscribe, readCollapsed, () => "");

  const collapsed = useMemo<string[]>(() => {
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      // Someone hand-edited the value — treat it as "nothing collapsed".
      return [];
    }
  }, [raw]);

  const toggle = (href: string) => {
    const next = collapsed.includes(href)
      ? collapsed.filter((item) => item !== href)
      : [...collapsed, href];

    try {
      window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
    } catch {
      // Storage is a convenience; without it the sidebar simply forgets.
    }
    for (const listener of listeners) listener();
  };

  return { collapsed, toggle };
}

/**
 * Whether the whole sidebar is shrunk to an icon rail. Same store pattern as
 * the collapsed groups above, and independent of them: shrinking to a rail
 * does not forget which groups were open, so expanding again restores them.
 */
function readRail(): string {
  try {
    return window.localStorage.getItem(RAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function useRail() {
  const raw = useSyncExternalStore(subscribe, readRail, () => "");
  const rail = raw === "1";

  const toggle = () => {
    try {
      window.localStorage.setItem(RAIL_KEY, rail ? "" : "1");
    } catch {
      // Same as the groups: a convenience, not a requirement.
    }
    for (const listener of listeners) listener();
  };

  return { rail, toggle };
}

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ta = useTranslations("nav.admin");
  const active = activeNavHref(pathname);
  const { collapsed, toggle } = useCollapsedGroups();
  const { rail, toggle: toggleRail } = useRail();
  return (
    <aside
      className={`flex shrink-0 flex-col gap-1 border-r border-border px-3 py-4 transition-[width] duration-200 ${
        rail ? "w-16" : "w-62"
      }`}
    >
      <div
        className={
          rail
            ? "flex flex-col items-center gap-2 pt-1 pb-3"
            : "flex items-center gap-2.5 px-2 pt-1 pb-4"
        }
      >
        <Logo className="size-8 shrink-0" />
        {rail ? null : (
          <div className="min-w-0 flex-1 whitespace-nowrap">
            <Typography variant="title-3" as="p" className="leading-snug">
              {t("adminBrand")}
            </Typography>
            <Typography variant="body-4" as="p" className="text-muted-foreground">
              {t("adminSubtitle")}
            </Typography>
          </div>
        )}
        <Tooltip label={ta(rail ? "expandSidebar" : "collapseSidebar")} side="right">
          <button
            type="button"
            onClick={toggleRail}
            aria-expanded={!rail}
            aria-label={ta(rail ? "expandSidebar" : "collapseSidebar")}
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon icon={rail ? ICONS.panelLeftOpen : ICONS.panelLeftClose} className="size-4" />
          </button>
        </Tooltip>
      </div>
      <div role="separator" className="h-px w-full bg-border" />
      <nav aria-label={ta("mainNav")} className="mt-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavEntry
            key={item.href}
            item={item}
            active={active}
            pathname={pathname}
            collapsed={collapsed}
            onToggle={toggle}
            rail={rail}
          />
        ))}
      </nav>
    </aside>
  );
}

/**
 * An item gated by a capability is shown to everyone but locked until
 * `/auth/me` says the account holds it — an `admin` sees the row, disabled with
 * a reason, instead of wondering where it went. UX only; the backend is still
 * the boundary.
 */
function useIsLocked(): (item: NavItem) => boolean {
  const me = useMe();
  return (item) =>
    Boolean(item.disabled) ||
    (item.requires !== undefined && me.data?.[item.requires] !== true);
}

function NavEntry({
  item,
  active,
  pathname,
  collapsed,
  onToggle,
  rail = false,
}: {
  item: NavItem;
  active: string | undefined;
  pathname: string;
  collapsed: string[];
  onToggle: (href: string) => void;
  /** Icon-only: no label, no chevron, and a group's children are not drawn. */
  rail?: boolean;
}) {
  const ta = useTranslations("nav.admin");
  const isLocked = useIsLocked();
  const locked = isLocked(item);
  const reasonKey = item.reasonKey ?? (item.requires ? "disabled.requiresSuperAdmin" : undefined);

  // Top-level rows carry an icon; the indented children are text only.
  const icon = item.icon ? <Icon icon={item.icon} className="size-5 shrink-0" /> : null;
  const rowPadding = item.icon ? "px-3 py-[9px]" : "px-3 py-[7px]";

  if (rail) {
    // A rail has no room for children, so the group's icon stands for the whole
    // section: it lights up when the current page is the group or any child.
    const label = ta(item.labelKey);
    const railActive =
      item.href === active || item.children?.some((child) => child.href === active);
    const railRow = `flex items-center justify-center rounded-md py-2.5 transition-colors ${
      railActive ? "bg-muted" : "hover:bg-muted/60"
    }`;

    if (locked) {
      return (
        <Tooltip label={reasonKey ? `${label} — ${ta(reasonKey)}` : label} side="right">
          <span
            aria-disabled="true"
            aria-label={label}
            className="flex cursor-not-allowed items-center justify-center rounded-md py-2.5 text-muted-foreground"
          >
            {icon}
          </span>
        </Tooltip>
      );
    }

    const railLink = (
      <Link
        href={item.href}
        aria-label={label}
        aria-current={item.href === active ? "page" : undefined}
        className={railRow}
      >
        {icon}
      </Link>
    );

    const visibleChildren = item.children ?? [];

    // No children: the label tooltip is enough.
    if (!visibleChildren.length) {
      return (
        <Tooltip label={label} side="right">
          {railLink}
        </Tooltip>
      );
    }

    // A group: hovering (or focusing) the icon opens a flyout with the children,
    // since the rail has no room to draw them inline. Clicking the icon still
    // goes to the group's own page.
    return (
      <HoverFlyout label={label} trigger={railLink}>
        <ul className="flex flex-col gap-0.5">
          {visibleChildren.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                aria-current={child.href === active ? "page" : undefined}
                className={`block rounded-md px-3 py-[7px] text-body-3 transition-colors ${
                  child.href === active ? "bg-muted font-semibold" : "hover:bg-muted/60"
                }`}
              >
                {ta(child.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </HoverFlyout>
    );
  }

  if (locked) {
    return (
      <span
        title={reasonKey ? ta(reasonKey) : undefined}
        aria-disabled="true"
        className={`flex cursor-not-allowed items-center gap-3 rounded-md text-body-3 text-muted-foreground ${rowPadding}`}
      >
        {icon}
        {ta(item.labelKey)}
      </span>
    );
  }

  const isActive = item.href === active;
  const rowTone = isActive ? "bg-muted font-semibold" : "hover:bg-muted/60";
  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-w-0 flex-1 items-center gap-3 rounded-md text-body-3 transition-colors ${rowPadding} ${
        item.children?.length ? "" : rowTone
      }`}
    >
      {icon}
      <Typography variant="body-3" as="span" className="min-w-0 flex-1 truncate">
        {ta(item.labelKey)}
      </Typography>
    </Link>
  );

  if (!item.children?.length) return link;

  /*
   * A collapsed group whose child IS the current screen stays open regardless:
   * hiding the row that is highlighted right now would leave the sidebar
   * disagreeing with the page, and the user cannot see where they are.
   */
  const holdsCurrentPage = pathname.startsWith(`${item.href}/`);
  const isOpen = holdsCurrentPage || !collapsed.includes(item.href);
  const groupId = `nav-group-${item.href.replace(/\W+/g, "-")}`;

  return (
    <div>
      {/*
       * One row, two targets: the label is still a plain link and the chevron
       * at the right edge is its own button. Making the whole row toggle would
       * cost the one-click path to /posts, and a row that both navigates and
       * expands does neither predictably.
       */}
      <div className={`flex items-center rounded-md transition-colors ${rowTone}`}>
        {link}
        <button
          type="button"
          onClick={() => onToggle(item.href)}
          aria-expanded={isOpen}
          aria-controls={groupId}
          aria-label={ta(isOpen ? "collapseGroup" : "expandGroup", {
            section: ta(item.labelKey),
          })}
          disabled={holdsCurrentPage}
          className="mr-2 grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        >
          <Icon
            icon={isOpen ? ICONS.chevronDown : ICONS.chevronRight}
            className="size-4"
          />
        </button>
      </div>

      {/*
       * The nested <ul> is what tells a screen reader these belong to the
       * section above; the indent alone says nothing.
       */}
      <ul
        id={groupId}
        hidden={!isOpen}
        className="mt-0.5 mb-1 ml-[22px] flex flex-col gap-0.5 border-l border-border pl-2.5"
      >
        {item.children.map((child) => (
          <li key={child.href}>
            <NavEntry
              item={child}
              active={active}
              pathname={pathname}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
