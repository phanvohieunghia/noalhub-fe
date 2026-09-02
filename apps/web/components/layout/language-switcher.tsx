"use client";

import type { Locale } from "@noalhub/i18n/config";
import { getPathname, usePathname } from "@noalhub/i18n/navigation";
import { LanguageSwitcher } from "@noalhub/ui/language-switcher";

/**
 * The web `LanguageSwitcher`: web URLs carry a locale prefix, so changing the
 * language means **changing the URL**, not just the cookie (§3.1). Writing the
 * cookie while staying on `/vi/...` lets the URL win and the page reverts to
 * Vietnamese on the next navigation.
 *
 * `usePathname` here is next-intl's version — it returns the path **with the
 * locale prefix stripped** but with dynamic segment values intact
 * (`/blogs/bai-viet-abc`), while `getPathname` reattaches the new prefix. The
 * user stays exactly where they were.
 *
 * ⚠️ **A HARD navigation (`location.assign`), not `router.replace`.** `<html>`
 * and `<head>` live in `app/[locale]/layout.tsx`, so changing the locale with a
 * soft navigation makes React rebuild that very block on the client — and it
 * contains the anti-flash theme `<script>`. React refuses to run a `<script>`
 * rendered on the client and logs "Encountered a script tag while rendering
 * React component". A full reload gets `<html lang>` right in the server's HTML
 * (which is what Googlebot reads) and lets the theme script run normally.
 * Changing language is a rare action; one reload here is cheap.
 */
export function WebLanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();

  const onSwitch = (locale: Locale) => {
    window.location.assign(getPathname({ href: pathname, locale }));
  };

  return <LanguageSwitcher onSwitch={onSwitch} className={className} />;
}
