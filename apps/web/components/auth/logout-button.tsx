"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@noalhub/ui/button";
import { useAuthStore } from "@noalhub/api/auth";

/**
 * ⚠️ The namespace is `nav`, NOT `web.auth`.
 *
 * This button lives in chat's account menu and on the dashboard — two places
 * where `IntlProvider` only loads `web.chat` / `web.dashboard`. Pinning it to
 * `web.auth` makes it throw `MISSING_MESSAGE` **at runtime** in exactly those
 * two places while TypeScript and `check-messages` both stay green (the key
 * really exists, it is simply not sent to the client on that route). `nav` is
 * one of the three namespaces every page loads.
 */
export function LogoutButton({ className }: { className?: string } = {}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    await logout();
    // The cache holds ONE user's data — without clearing it, the next user to
    // sign in on this tab sees the previous one's data for a beat.
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={pending} className={className}>
      {pending ? t("loggingOut") : t("logout")}
    </Button>
  );
}
