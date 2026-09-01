"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";

import { ChangeUsernameForm } from "@/components/profile/change-username-form";
import { Avatar } from "@noalhub/ui/avatar";
import { FormError } from "@noalhub/ui/form-error";
import { Spinner } from "@noalhub/ui/spinner";
import { useAuthStore } from "@noalhub/api/auth";
import { useMe } from "@noalhub/api/auth";
import type { User } from "@noalhub/api/users";
import { Typography } from "@noalhub/ui/typography";

/**
 * Hồ sơ của chính mình.
 *
 * Backend chưa có endpoint đọc hồ sơ người khác (spec chỉ có `/auth/me` và
 * `PATCH /users/me/username`), nên trang này mới chỉ phục vụ user hiện tại.
 */
export function ProfileContent() {
  const t = useTranslations("web.profile");
  const { data, isPending, error } = useMe();
  // Store đã có bản user từ lúc bootstrap/login — dùng làm nền để trang không
  // nháy skeleton khi query đang revalidate.
  const cached = useAuthStore((s) => s.user);
  const user = data ?? cached;

  if (!user) {
    if (isPending) {
      return (
        <main
          role="status"
          className="flex flex-1 items-center justify-center gap-2 p-8 text-body-3 opacity-70"
        >
          <Spinner />
          {t("loading")}
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <FormError message={error ? t("loadFailed") : t("noData")} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <header className="flex items-center gap-4">
        <Avatar name={user.displayName ?? user.username} src={user.avatarUrl} size="lg" />
        <div className="min-w-0">
          <Typography variant="h3" as="h1" className="truncate">
            {user.displayName ?? user.username}
          </Typography>
          <Typography variant="body-3" className="truncate font-mono opacity-70">
            @{user.username}
          </Typography>
        </div>
        <Link
          href="/dashboard"
          className="ml-auto inline-flex h-10 items-center rounded-md border border-black/15 px-4 text-body-3 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {t("dashboard")}
        </Link>
      </header>

      <ProfileFacts user={user} />

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <Typography variant="h5" as="h2">
          {t("username.heading")}
        </Typography>
        <ChangeUsernameForm user={user} />
      </section>
    </main>
  );
}

function ProfileFacts({ user }: { user: User }) {
  const t = useTranslations("web.profile.facts");
  const df = useDateFormat();

  return (
    <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15">
      <Fact label={t("email")}>
        <span className="font-mono">{user.email}</span>{" "}
        {user.emailVerified ? (
          <span className="text-green-700 dark:text-green-400">{t("verified")}</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-400">{t("unverified")}</span>
        )}
      </Fact>
      <Fact label={t("role")}>{t(user.role === "admin" ? "admin" : "member")}</Fact>
      <Fact label={t("joined")}>{df.date(user.createdAt)}</Fact>
      <Fact label={t("usernameChangedAt")}>
        {user.usernameChangedAt ? df.date(user.usernameChangedAt) : t("neverChanged")}
      </Fact>
      <Fact label={t("userId")}>
        <span className="font-mono">{user.id}</span>
      </Fact>
    </dl>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="opacity-70">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
