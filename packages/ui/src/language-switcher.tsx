"use client";

import { useChangeLanguage, type UserLanguage } from "@noalhub/api/users";
import { LOCALES, type Locale } from "@noalhub/i18n/config";
import { writeLocaleCookie } from "@noalhub/i18n/cookie";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "./button";

/**
 * Switches the interface language. Shared by web and admin; the part that
 * differs between the two apps — where to navigate afterwards — goes in the
 * `onSwitch` prop, because web has a locale prefix in the URL and admin does
 * not (`docs/i18n.md` §3).
 *
 * The order of operations is deliberate and must **not** be reversed (§4.2):
 * 1. Write the cookie, so the next server render is already in the right
 *    language.
 * 2. Call `PATCH /users/me/language`, so the choice follows the account to
 *    other machines.
 * 3. Navigate.
 *
 * ⚠️ Step 3 **must wait** for step 2, but only briefly. On web, navigation is
 * `location.assign` — the document unloads and the browser cancels the XHR in
 * flight. Firing and leaving immediately loses the choice: the cookie says
 * `en`, the account still says `vi`, and on the next login `LocaleSync` pulls
 * it back to `vi` — the user watches the change they just made get undone.
 *
 * Waiting **without a limit** is the opposite failure: a slow network freezes
 * the button indefinitely, and a signed-out visitor always waits out a full 401
 * round-trip. So: wait at most `PERSIST_GRACE_MS` and go regardless — the
 * cookie is already written, so the UI is right either way; this one time it
 * simply did not make it to the account.
 *
 * The `nav` namespace — one of the three every page loads. A component in
 * `packages/ui` must not use one app's own namespace (§6).
 */
/**
 * How long to wait for the API before navigating. Wide enough for a real
 * request (~20ms locally, ~200ms over the network), narrow enough that nobody
 * sees the button hang.
 */
const PERSIST_GRACE_MS = 600;

export function LanguageSwitcher({
  onSwitch,
  className = "",
}: {
  onSwitch: (locale: Locale) => void;
  className?: string;
}) {
  const t = useTranslations("nav.languageSwitcher");
  const active = useLocale();
  const changeLanguage = useChangeLanguage();

  const switchTo = async (locale: Locale) => {
    if (locale === active || changeLanguage.isPending) return;

    writeLocaleCookie(locale);

    // Signed out means a 401 — the cookie is enough, and it is all that can be
    // stored for a guest. Swallow the error; there is nothing the user could do
    // with it.
    await Promise.race([
      changeLanguage.mutateAsync({ language: locale as UserLanguage }).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, PERSIST_GRACE_MS)),
    ]);

    onSwitch(locale);
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`inline-flex items-center gap-0.5 rounded-full border border-border p-0.5 ${className}`}
    >
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant={locale === active ? "primary" : "ghost"}
          size="sm"
          shape="circle"
          onClick={() => void switchTo(locale)}
          aria-pressed={locale === active}
          // The few hundred milliseconds of saving are real — the button has to
          // say so, or the user clicks it a second time.
          disabled={changeLanguage.isPending}
          aria-busy={changeLanguage.isPending}
          // `whitespace-nowrap`: the longest label ("Tiếng Việt") wraps onto two
          // lines inside admin's account dropdown, which is only 16rem wide.
          className="px-3 whitespace-nowrap"
        >
          {t(locale)}
        </Button>
      ))}
    </div>
  );
}
