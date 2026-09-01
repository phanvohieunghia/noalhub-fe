"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { LogoutButton } from "@/components/auth/logout-button";
import { useAuthStore } from "@noalhub/api/auth";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";
import { Typography } from "@noalhub/ui/typography";

/** Trang mẫu để verify luồng auth end-to-end. */
export function DashboardContent() {
  const t = useTranslations("web.dashboard");
  const user = useAuthStore((s) => s.user);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Typography variant="h3" as="h1">
            {t("title")}
          </Typography>
          <Typography variant="body-3" className="opacity-70">
            {t("greeting", { name: user?.displayName ?? user?.email ?? t("you") })}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/profile"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-body-3 font-medium hover:bg-muted"
          >
            {t("profile")}
          </Link>
          <Link
            href="/chat"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-body-3 font-medium hover:bg-muted"
          >
            {t("chat")}
          </Link>
          <LogoutButton />
        </div>
      </div>

      <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15">
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">{t("email")}</dt>
          <dd className="font-mono">{user?.email ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">{t("userId")}</dt>
          <dd className="font-mono">{user?.id ?? "—"}</dd>
        </div>
      </dl>
    </main>
  );
}
