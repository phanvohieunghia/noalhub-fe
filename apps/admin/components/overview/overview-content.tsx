"use client";

import { useAdminStats } from "@noalhub/api/admin";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import { Button } from "@noalhub/ui/button";
import { StatCard } from "@noalhub/ui/stat-card";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

/**
 * Tổng quan — 4 số từ `GET /admin/stats`.
 *
 * Backend **không cache** endpoint này, nhưng nó cũng không phải realtime: có
 * nút refresh và mốc "cập nhật lúc" thay vì để người đọc tưởng số tự chạy.
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
          {/* dataUpdatedAt = lúc response về, không phải lúc backend tính. Đủ
              chính xác cho mục đích "số này cũ chưa". */}
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
