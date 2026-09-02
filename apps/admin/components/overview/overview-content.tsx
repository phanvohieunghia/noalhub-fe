"use client";

import { useAdminStats } from "@noalhub/api/admin";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import { Button } from "@noalhub/ui/button";
import { StatCard } from "@noalhub/ui/stat-card";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

/**
 * The overview — four numbers from `GET /admin/stats`.
 *
 * The backend does **not** cache this endpoint, but it is not realtime either:
 * there is a refresh button and an "updated at" stamp, rather than letting the
 * reader assume the numbers move on their own.
 */
export function OverviewContent() {
  const t = useTranslations("admin.overview");
  const df = useDateFormat();
  const stats = useAdminStats();

  if (stats.isError) {
    return (
      <main className="w-full p-6">
        <Typography variant="h4" as="h1" className="mb-4">
          {t("title")}
        </Typography>
        <AdminErrorState error={stats.error} onRetry={() => stats.refetch()} />
      </main>
    );
  }

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h4" as="h1">
          {t("title")}
        </Typography>
        <div className="text-body-4 flex items-center gap-3 opacity-60">
          {/* dataUpdatedAt is when the response arrived, not when the backend
              computed it. Accurate enough for "how stale is this number?". */}
          {stats.dataUpdatedAt ? (
            <span>{t("updatedAt", { date: df.dateTime(new Date(stats.dataUpdatedAt).toISOString()) })}</span>
          ) : null}
          <Button variant="outline" onClick={() => stats.refetch()} disabled={stats.isFetching}>
            {stats.isFetching ? t("refreshing") : t("refresh")}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("totalUsers")}
          value={stats.data?.totalUsers ?? 0}
          isLoading={stats.isPending}
          hint={t("totalUsersHint")}
        />
        <StatCard
          label={t("verifiedUsers")}
          value={stats.data?.verifiedUsers ?? 0}
          isLoading={stats.isPending}
        />
        <StatCard
          label={t("newUsers")}
          value={stats.data?.newUsersLast7Days ?? 0}
          isLoading={stats.isPending}
          hint={t("newUsersHint")}
        />
        <StatCard
          label={t("admins")}
          value={stats.data?.admins ?? 0}
          isLoading={stats.isPending}
        />
      </div>
    </main>
  );
}
