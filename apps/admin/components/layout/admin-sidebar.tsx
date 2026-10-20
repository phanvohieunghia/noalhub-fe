"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

import { useMe } from "@noalhub/api/auth";

import { FLAT_NAV_ITEMS, NAV_ITEMS, type NavItem } from "./nav-items";
import { Sidebar, type SidebarItem } from "@noalhub/ui/sidebar";

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

/**
 * The admin's own wiring around the presentational `Sidebar` in `packages/ui`:
 * which item is active, which groups are collapsed, whether it is a rail, who is
 * locked out — and the translation of keys into words.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ta = useTranslations("nav.admin");
  const active = activeNavHref(pathname);
  const { collapsed, toggle } = useCollapsedGroups();
  const { rail, toggle: toggleRail } = useRail();
  const isLocked = useIsLocked();

  const toItem = (item: NavItem): SidebarItem => {
    const reasonKey =
      item.reasonKey ?? (item.requires ? "disabled.requiresSuperAdmin" : undefined);
    return {
      href: item.href,
      label: ta(item.labelKey),
      icon: item.icon,
      locked: isLocked(item),
      lockedReason: reasonKey ? ta(reasonKey) : undefined,
      children: item.children?.map(toItem),
    };
  };

  return (
    <Sidebar
      brand={{ title: t("adminBrand"), subtitle: t("adminSubtitle") }}
      items={NAV_ITEMS.map(toItem)}
      pathname={pathname}
      activeHref={active}
      collapsedGroups={collapsed}
      onToggleGroup={toggle}
      rail={rail}
      onToggleRail={toggleRail}
      labels={{
        nav: ta("mainNav"),
        expandSidebar: ta("expandSidebar"),
        collapseSidebar: ta("collapseSidebar"),
        group: (open, section) => ta(open ? "collapseGroup" : "expandGroup", { section }),
      }}
    />
  );
}
