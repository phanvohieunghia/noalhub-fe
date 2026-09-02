"use client";

import { LanguageSwitcher } from "@noalhub/ui/language-switcher";
import { useRouter } from "next/navigation";

/**
 * The admin `LanguageSwitcher`: admin URLs carry no locale (§3.2), so it only
 * has to write the cookie and ask Next to re-render from the server with it.
 *
 * `router.refresh()` rather than `location.reload()`: client state is preserved
 * (the selected filters, the draft in the editor) while only the
 * server-rendered part is refetched — and the server-rendered part is where the
 * messages live.
 */
export function AdminLanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();

  return <LanguageSwitcher onSwitch={() => router.refresh()} className={className} />;
}
