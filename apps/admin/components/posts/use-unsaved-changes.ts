"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

/**
 * Blocks leaving the page while there are unsaved changes.
 *
 * **Required, not optional** (`docs/blog.md` §7.3): the editor deliberately does
 * not autosave, so this is the ONLY safety net standing in for it.
 *
 * Two ways out of the page, two ways to block:
 *
 * 1. **Closing the tab / F5 / typing another URL** — `beforeunload`. The browser
 *    shows its own dialog; the wording cannot be changed, only enabled or not.
 * 2. **Clicking a link inside the app** — a click listener in the **capture
 *    phase** on `document`, ahead of Next's router. `preventDefault` alone is not
 *    enough: Next's `<Link>` navigates inside its own onClick handler, so
 *    `stopPropagation` is needed to keep the event from reaching it.
 *
 * ⚠️ The browser's **Back** button cannot be blocked this way. App Router has no
 * navigation-blocking API (`useBlocker` belongs to React Router), and every
 * workaround through `history.pushState` damages browsing history in ways far
 * harder to repair than losing one unsaved edit. Written down so this is a
 * CONSCIOUS gap rather than an oversight.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const t = useTranslations("admin.posts");

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // A few older browsers still need `returnValue` before showing the dialog.
      event.returnValue = "";
    };

    const onClickCapture = (event: MouseEvent) => {
      // Ignore secondary clicks, and ignore deliberate new-tab opens — this tab
      // is not going anywhere, so there is nothing to lose.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || anchor.target === "_blank") return;
      // An external link leaves the app entirely — `beforeunload` above covers it.
      if (!href.startsWith("/")) return;
      if (href === window.location.pathname) return;

      if (!window.confirm(t("unsavedChanges"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [isDirty, t]);
}
