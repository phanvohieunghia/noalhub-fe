"use client";

import type { Locale } from "@noalhub/i18n/config";
import { getPathname, usePathname } from "@noalhub/i18n/navigation";
import { LocaleSync } from "@noalhub/ui/auth/locale-sync";
import { useCallback } from "react";

/**
 * See `LocaleSync`. Web has a locale prefix, so syncing means changing the URL —
 * and by a hard navigation too, for the same reason as `WebLanguageSwitcher`.
 */
export function WebLocaleSync() {
  const pathname = usePathname();

  const onMismatch = useCallback(
    (locale: Locale) => window.location.assign(getPathname({ href: pathname, locale })),
    [pathname],
  );

  return <LocaleSync onMismatch={onMismatch} />;
}
