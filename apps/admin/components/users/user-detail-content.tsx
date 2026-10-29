"use client";

import Link from "next/link";

import { useAdminUser } from "@noalhub/api/admin";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import { Avatar } from "@noalhub/ui/avatar";
import { Badge } from "@noalhub/ui/badge";
import { Skeleton } from "@noalhub/ui/skeleton";

import { AdminErrorState } from "../admin-error-state";
import { QaAnswersSection } from "../overview/qa-answers-section";
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
        {/* AdminUserDto answers "who is this person", so it carries `role` and
            no capability flags — this is display, not a permission branch. */}
        <Badge tone={data.role === "user" ? "neutral" : "info"} className="ml-auto">
          {data.role}
        </Badge>
      </div>

      <dl className="mt-6 grid grid-cols-[12rem_1fr] gap-y-3 text-body-3">
        <Typography variant="body-3" as="dt" className="opacity-60">
          {t("columns.email")}
        </Typography>
        <Typography variant="body-3" as="dd" className="flex items-center gap-2">
          {data.email}
          {data.emailVerifiedAt ? (
            <Badge tone="success">{t("verifiedAt", { date: df.date(data.emailVerifiedAt) })}</Badge>
          ) : (
            <Badge tone="warning">{t("unverified")}</Badge>
          )}
        </Typography>

        <Typography variant="body-3" as="dt" className="opacity-60">
          {t("detail.id")}
        </Typography>
        <Typography variant="body-4" as="dd" className="font-mono opacity-70">
          {data.id}
        </Typography>

        <Typography variant="body-3" as="dt" className="opacity-60">
          {t("columns.joined")}
        </Typography>
        <Typography variant="body-3" as="dd">
          {df.dateTime(data.createdAt)}
        </Typography>

        <Typography variant="body-3" as="dt" className="opacity-60">
          {t("detail.usernameChangedAt")}
        </Typography>
        <Typography variant="body-3" as="dd">
          {data.usernameChangedAt ? df.dateTime(data.usernameChangedAt) : t("neverChanged")}
        </Typography>

        {/* ⚠️ NOT an online state: this endpoint does not read presence (the
            spec says so outright). The label is "last active", and there is
            deliberately no green/gray dot here — see `docs/admin-plan.md` §2. */}
        <Typography variant="body-3" as="dt" className="opacity-60">
          {t("columns.lastSeen")}
        </Typography>
        <Typography variant="body-3" as="dd">
          {data.lastSeenAt ? df.dateTime(data.lastSeenAt) : t("neverOnline")}
          <Typography variant="body-4" as="span" className="block opacity-50">
            {t("detail.lastSeenNote")}
          </Typography>
        </Typography>
      </dl>

      <QaAnswersSection userId={userId} />

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
