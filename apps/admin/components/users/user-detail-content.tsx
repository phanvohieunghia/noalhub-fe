"use client";

import Link from "next/link";

import { useAdminUser } from "@noalhub/api/admin";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import { Avatar } from "@noalhub/ui/avatar";
import { Badge } from "@noalhub/ui/badge";
import { Skeleton } from "@noalhub/ui/skeleton";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

export function UserDetailContent({ userId }: { userId: string }) {
  const t = useTranslations("admin.users");
  const df = useDateFormat();
  const user = useAdminUser(userId);

  if (user.isPending) {
    return (
      <main className="w-full space-y-4 p-6" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (user.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={user.error} onRetry={() => user.refetch()} />
        <Typography variant="body-3" className="mt-3">
          <Link href="/users" className="underline opacity-70">
            {t("detail.backToList")}
          </Link>
        </Typography>
      </main>
    );
  }

  const data = user.data;

  return (
    <main className="w-full p-6">
      <div className="flex items-center gap-3">
        <Avatar src={data.avatarUrl} name={data.displayName ?? data.username} size="lg" />
        <div>
          <Typography variant="h4" as="h1">
            {data.displayName ?? data.username}
          </Typography>
          <Typography variant="body-3" className="opacity-60">
            @{data.username}
          </Typography>
        </div>
        <Badge tone={data.role === "admin" ? "info" : "neutral"} className="ml-auto">
          {data.role}
        </Badge>
      </div>

      <dl className="mt-6 grid grid-cols-[12rem_1fr] gap-y-3 text-body-3">
        <dt className="opacity-60">{t("columns.email")}</dt>
        <dd className="flex items-center gap-2">
          {data.email}
          {data.emailVerifiedAt ? (
            <Badge tone="success">{t("verifiedAt", { date: df.date(data.emailVerifiedAt) })}</Badge>
          ) : (
            <Badge tone="warning">{t("unverified")}</Badge>
          )}
        </dd>

        <dt className="opacity-60">{t("detail.id")}</dt>
        <Typography variant="body-4" as="dd" className="font-mono opacity-70">
          {data.id}
        </Typography>

        <dt className="opacity-60">{t("columns.joined")}</dt>
        <dd>{df.dateTime(data.createdAt)}</dd>

        <dt className="opacity-60">{t("detail.usernameChangedAt")}</dt>
        <dd>{data.usernameChangedAt ? df.dateTime(data.usernameChangedAt) : t("neverChanged")}</dd>

        {/* ⚠️ NOT an online state: this endpoint does not read presence (the
            spec says so outright). The label is "last active", and there is
            deliberately no green/gray dot here — see `docs/admin-plan.md` §2. */}
        <dt className="opacity-60">{t("columns.lastSeen")}</dt>
        <dd>
          {data.lastSeenAt ? df.dateTime(data.lastSeenAt) : t("neverOnline")}
          <Typography variant="body-4" as="span" className="block opacity-50">
            {t("detail.lastSeenNote")}
          </Typography>
        </dd>
      </dl>

      {/* Having no action buttons reflects reality: the backend has no ban/lock,
          role change, user deletion or forced logout yet
          (`admin-plan.md` §3/§3b). */}
      <Typography
        variant="body-4"
        className="mt-6 rounded-md border border-black/10 p-3 opacity-60 dark:border-white/15"
      >
        {t.rich("detail.noActions", {
          doc: (chunks) => <code className="mx-1">{chunks}</code>,
        })}
      </Typography>

      <Typography variant="body-3" className="mt-4">
        <Link href="/users" className="underline opacity-70">
          {t("detail.backToList")}
        </Link>
      </Typography>
    </main>
  );
}
