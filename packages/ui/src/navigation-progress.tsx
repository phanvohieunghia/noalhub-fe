"use client";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

/**
 * A thin progress bar for page transitions.
 *
 * **Why it exists:** most routes in this repo render on demand (`ƒ` in
 * `next build` output) — all of admin, and every listing page in web that takes
 * `searchParams`. App Router keeps the old page on screen until the new RSC
 * payload arrives, so to the user a slow click looks exactly like a broken one.
 * This bar is the feedback for that gap.
 *
 * **Why not `useLinkStatus`:** that hook only works inside a single `<Link>`
 * (it reads the parent link's context), so it suits an in-place effect on the
 * link just clicked and cannot build one shared bar for the whole app.
 *
 * **How it detects:**
 * - *Start*: a `click` listener on `document` in the capture phase — capture is
 *   required so it runs before `<Link>`'s own handler. It then filters down to
 *   clicks that really leave the current URL.
 * - *End*: `usePathname` or `useSearchParams` changes value. That is the only
 *   signal App Router emits when a navigation completes — there is no
 *   `router.events` like in the Pages Router.
 *
 * Programmatic navigation (`router.push` inside a handler) is deliberately NOT
 * caught: those places already have their own state ("Saving…", "Signing in…"),
 * and catching them by patching `history.pushState` means owning every
 * consequence of patching a browser API for very little in return.
 *
 * **Mounted in the root layout, once for the whole app.** The first version
 * attached it to each header (blog, admin, chat) to sit literally "under the
 * header" — wrong: `/dashboard`, `/profile`, `/friends` and every auth page
 * have **no header at all**, so exactly those pages got no feedback. A `fixed`
 * bar at the top of the viewport covers everything, and on pages with a header
 * it sits right on the header's edge.
 */
export function NavigationProgress({ className }: { className?: string }) {
  /*
   * `useSearchParams` must sit under a Suspense boundary, or every static page
   * containing this component breaks at prerender. Wrapped here so call sites
   * do not have to remember.
   */
  return (
    <Suspense fallback={null}>
      <ProgressBar className={className} />
    </Suspense>
  );
}

/** The ceiling: never reach 100% before completion — 100% means "arrived". */
const CEILING = 90;

/**
 * The delay before showing. A prefetched route transitions almost instantly;
 * showing the bar for those produces a flicker that is worse than nothing.
 */
const SHOW_DELAY_MS = 120;

/** Safety net: if a navigation is cancelled (a 404 download, a hidden tab…) the bar still goes away. */
const MAX_DURATION_MS = 15_000;

function ProgressBar({ className = "fixed inset-x-0 top-0 z-60" }: { className?: string }) {
  const t = useTranslations("common.states");
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const [value, setValue] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const tickRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setValue((current) => (current === null ? null : 100));
    // Let the width transition finish before removing it, or the bar vanishes mid-way.
    timers.current.push(window.setTimeout(() => setValue(null), 220));
  }, [clearTimers]);

  const start = useCallback(() => {
    if (tickRef.current !== null) return; // already running
    clearTimers();

    timers.current.push(
      window.setTimeout(() => {
        setValue(12);
        /*
         * Decelerating growth: each tick covers a small fraction of whatever
         * distance is left to the ceiling. The bar therefore always moves (the
         * user sees "it is working") but never arrives before the data — that
         * is the kind of lie people notice instantly.
         */
        tickRef.current = window.setInterval(() => {
          setValue((current) => {
            if (current === null) return current;
            return current + (CEILING - current) * 0.12;
          });
        }, 220);
      }, SHOW_DELAY_MS),
      window.setTimeout(finish, MAX_DURATION_MS),
    );
  }, [clearTimers, finish]);

  // A changed URL means the navigation finished. Skip the first run on mount.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    finish();
  }, [pathname, search, finish]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isInAppNavigation(event)) return;
      start();
    };

    // Back/forward is a navigation too, and can be just as slow.
    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  return (
    <span className={`pointer-events-none block h-[3px] overflow-hidden ${className}`}>
      <span
        aria-hidden
        /*
         * `shadow`: a fast transition only lets the bar sweep past for a few
         * hundred milliseconds. At 3px the glow is what makes the eye catch it
         * at all — without it, users report "I never saw any bar".
         */
        className="block h-full rounded-r-full bg-primary shadow-[0_0_10px_2px_var(--primary)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${value ?? 0}%`,
          opacity: value === null ? 0 : 1,
        }}
      />
      {/* A colored bar says nothing to a screen reader; this sentence is what
          actually communicates. `role="status"` so it is announced without
          stealing focus. */}
      {value !== null ? (
        <span role="status" className="sr-only">
          {t("loading")}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Does this click really lead to another page **inside the app**?
 *
 * Every `false` branch below is a bar-that-never-stops if missed: an unchanged
 * URL means `usePathname` never reports completion, and a download or
 * cross-origin link means this page never navigates anywhere at all.
 */
function isInAppNavigation(event: MouseEvent): boolean {
  // Middle/right click, or a modifier to open a new tab → this tab stays put.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (event.defaultPrevented) return false;

  const anchor = (event.target as HTMLElement | null)?.closest?.("a");
  const href = anchor?.getAttribute("href");
  if (!anchor || !href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // An in-page anchor: no navigation.
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }
  /*
   * A path with a dot means a route handler serving a file
   * (`/vi/blogs/rss.xml`, `/sitemap.xml`). The browser downloads it, React
   * re-renders nothing, so there is no completion signal to wait for. Same rule
   * as `proxy.ts`'s matcher.
   */
  if (url.pathname.split("/").pop()?.includes(".")) return false;

  return true;
}
