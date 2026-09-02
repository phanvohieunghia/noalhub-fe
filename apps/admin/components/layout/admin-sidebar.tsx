"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

import { FLAT_NAV_ITEMS, NAV_ITEMS, type NavItem } from "./nav-items";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Logo } from "@noalhub/ui/logo";
import { Typography } from "@noalhub/ui/typography";

const COLLAPSED_KEY = "admin.sidebar.collapsedGroups";

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

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ta = useTranslations("nav.admin");
  const active = activeNavHref(pathname);
  const { collapsed, toggle } = useCollapsedGroups();

  return (
    <aside className="w-56 shrink-0 border-r border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center gap-2 px-2 py-3">
        <Logo className="size-7" />
        <Typography variant="title-4" weight={600}>
          {t("adminTitle")}
        </Typography>
      </div>
      <nav aria-label={ta("mainNav")} className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavEntry
            key={item.href}
            item={item}
            active={active}
            pathname={pathname}
            collapsed={collapsed}
            onToggle={toggle}
          />
        ))}
      </nav>
    </aside>
  );
}

function NavEntry({
  item,
  active,
  pathname,
  collapsed,
  onToggle,
}: {
  item: NavItem;
  active: string | undefined;
  pathname: string;
  collapsed: string[];
  onToggle: (href: string) => void;
}) {
  const ta = useTranslations("nav.admin");

  if (item.disabled) {
    return (
      <Typography
        variant="body-3"
        as="span"
        title={item.reasonKey ? ta(item.reasonKey) : undefined}
        aria-disabled="true"
        className="cursor-not-allowed rounded-md px-2 py-1.5 opacity-40"
      >
        {ta(item.labelKey)}
      </Typography>
    );
  }

  const isActive = item.href === active;
  const link = (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`block rounded-md px-2 py-1.5 text-body-3 transition-colors ${
        isActive
          ? "bg-black/8 font-medium dark:bg-white/12"
          : "hover:bg-black/5 dark:hover:bg-white/8"
      }`}
    >
      {ta(item.labelKey)}
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
      <div className="flex items-center gap-1">
        {/*
         * The label stays a plain link and the chevron is its own button: making
         * the whole row toggle would cost the one-click path to /posts, and a
         * row that both navigates and expands does neither predictably.
         */}
        <div className="min-w-0 flex-1">{link}</div>
        <button
          type="button"
          onClick={() => onToggle(item.href)}
          aria-expanded={isOpen}
          aria-controls={groupId}
          aria-label={ta(isOpen ? "collapseGroup" : "expandGroup", {
            section: ta(item.labelKey),
          })}
          disabled={holdsCurrentPage}
          className="rounded-md p-1 opacity-60 transition-colors hover:bg-black/5 hover:opacity-100 disabled:pointer-events-none disabled:opacity-25 dark:hover:bg-white/8"
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
        className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l border-black/10 pl-2 dark:border-white/15"
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
