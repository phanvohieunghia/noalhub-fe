"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useMe, type UserRole } from "@noalhub/api/auth";

import { Button } from "../button";
import { Typography } from "../typography";

/**
 * The second layer after `AuthGuard`: signed in **and** holding the right role.
 *
 * Why it is needed: `AuthGuard` only checks `status === "authenticated"`, which
 * means any ordinary user can walk into admin's `/dashboard`. The backend still
 * answers 403 so no data leaks, but letting them in is wrong and produces a
 * screen made entirely of errors.
 *
 * It lives in `packages/ui` rather than `apps/admin` because it is shared
 * session chrome, not an admin feature — `apps/web` may need role gating later
 * too.
 *
 * This guard is **UX, not security**: the role is read from `/auth/me` on the
 * client and anyone can edit it in devtools. The real boundary is still the
 * backend's 403.
 */
export function RoleGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const t = useTranslations("common.guard");
  const me = useMe();
  const router = useRouter();

  const isDenied = me.isSuccess && me.data.role !== role;

  useEffect(() => {
    // No auto-redirect. Kicking a user with a VALID session out to `/login` is
    // a loop: they log in, land here, get kicked again, and never get to read
    // why. The screen below states the reason and lets them choose to sign out.
    if (isDenied) {
      router.prefetch("/login");
    }
  }, [isDenied, router]);

  if (me.isPending) return <RoleSkeleton />;

  // A failure to load `/auth/me` (network, 5xx) is nothing like a wrong role —
  // do not collapse it into "no permission", or the user hunts the wrong cause.
  if (me.isError) {
    return (
      <GuardScreen
        title={t("sessionErrorTitle")}
        message={t("sessionErrorMessage")}
      />
    );
  }

  if (isDenied) {
    return (
      <GuardScreen
        title={t("deniedTitle")}
        message={t("deniedMessage", { role, email: me.data.email })}
        action={
          <Button onClick={() => router.replace("/login")}>{t("signInAsOther")}</Button>
        }
      />
    );
  }

  return <>{children}</>;
}

function GuardScreen({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <main
      role="alert"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <Typography variant="h5" as="h1">
        {title}
      </Typography>
      <Typography variant="body-3" className="opacity-70">
        {message}
      </Typography>
      {action}
    </main>
  );
}

function RoleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse space-y-4 p-8" aria-busy="true">
      <div className="h-8 w-48 rounded bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
    </div>
  );
}
