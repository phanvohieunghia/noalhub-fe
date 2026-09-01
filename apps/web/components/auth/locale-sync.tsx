"use client";

import type { Locale } from "@noalhub/i18n/config";
import { getPathname, usePathname } from "@noalhub/i18n/navigation";
import { LocaleSync } from "@noalhub/ui/auth/locale-sync";
import { useCallback } from "react";

/**
 * Xem `LocaleSync`. Web có tiền tố locale nên đồng bộ = đổi URL — và cũng bằng
 * điều hướng cứng, cùng lý do với `WebLanguageSwitcher`.
 */
export function WebLocaleSync() {
  const pathname = usePathname();

  const onMismatch = useCallback(
    (locale: Locale) => window.location.assign(getPathname({ href: pathname, locale })),
    [pathname],
  );

  return <LocaleSync onMismatch={onMismatch} />;
}
