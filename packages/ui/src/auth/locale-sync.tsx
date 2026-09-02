"use client";

import { useMe } from "@noalhub/api/auth";
import { isLocale, type Locale } from "@noalhub/i18n/config";
import { readLocaleCookie, writeLocaleCookie } from "@noalhub/i18n/cookie";
import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * The **only** point where `user.language` beats the cookie (`docs/i18n.md`
 * §4.2).
 *
 * SSR does not know who the user is: the token lives in `tokenStore`, not in a
 * cookie (`docs/auth.md`), so a server render has nothing but the cookie to go
 * on. The account's real choice is known only once `bootstrap()` or login has
 * finished — and if it differs, the cookie and the UI are pulled to match the
 * account.
 *
 * A known, accepted consequence (§10): signing in on an unfamiliar machine
 * whose cookie says `en` while the account says `vi` shows the UI switch one
 * beat after entry. Unavoidable while the server cannot know the user before
 * rendering.
 *
 * Logging out does **not** reset to `vi`: the person was just reading in
 * English.
 */
export function LocaleSync({ onMismatch }: { onMismatch: (locale: Locale) => void }) {
  const me = useMe();
  const active = useLocale();
  const language = me.data?.language;

  useEffect(() => {
    if (!language || !isLocale(language)) return;
    if (language === active && readLocaleCookie() === language) return;

    writeLocaleCookie(language);
    if (language !== active) onMismatch(language);
  }, [language, active, onMismatch]);

  return null;
}
