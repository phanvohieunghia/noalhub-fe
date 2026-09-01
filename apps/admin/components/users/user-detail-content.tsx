"use client";

import Link from "next/link";

import { useAdminUser } from "@noalhub/api/admin";
import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { Avatar } from "@noalhub/ui/avatar";
import { Badge } from "@noalhub/ui/badge";
import { Skeleton } from "@noalhub/ui/skeleton";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

export function UserDetailContent({ userId }: { userId: string }) {
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
            Về danh sách người dùng
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
        <dt className="opacity-60">Email</dt>
        <dd className="flex items-center gap-2">
          {data.email}
          {data.emailVerifiedAt ? (
            <Badge tone="success">Verify {formatDate(data.emailVerifiedAt)}</Badge>
          ) : (
            <Badge tone="warning">Chưa verify</Badge>
          )}
        </dd>

        <dt className="opacity-60">ID</dt>
        <Typography variant="body-4" as="dd" className="font-mono opacity-70">
          {data.id}
        </Typography>

        <dt className="opacity-60">Tham gia</dt>
        <dd>{formatDateTime(data.createdAt)}</dd>

        <dt className="opacity-60">Đổi username lần cuối</dt>
        <dd>{data.usernameChangedAt ? formatDateTime(data.usernameChangedAt) : "Chưa từng đổi"}</dd>

        {/* ⚠️ KHÔNG phải trạng thái online: endpoint này không đọc presence
            (spec nói thẳng). Nhãn là "hoạt động lần cuối", và cố ý không có
            dot xanh/xám ở đây — xem `docs/admin-plan.md` §2. */}
        <dt className="opacity-60">Hoạt động lần cuối</dt>
        <dd>
          {data.lastSeenAt ? formatDateTime(data.lastSeenAt) : "Chưa từng online"}
          <Typography variant="body-4" as="span" className="block opacity-50">
            Mốc offline gần nhất, không phải trạng thái online hiện tại.
          </Typography>
        </dd>
      </dl>

      {/* Không có nút hành động nào là đúng hiện trạng: backend chưa có
          ban/khoá, đổi role, xoá user hay buộc logout (`admin-plan.md` §3/§3b). */}
      <Typography
        variant="body-4"
        className="mt-6 rounded-md border border-black/10 p-3 opacity-60 dark:border-white/15"
      >
        Chưa có hành động quản trị nào cho tài khoản này — khoá, đổi vai trò và thu hồi phiên đều
        cần endpoint chưa có ở backend (xem
        <code className="mx-1">docs/admin-plan.md</code> §3b).
      </Typography>

      <Typography variant="body-3" className="mt-4">
        <Link href="/users" className="underline opacity-70">
          Về danh sách người dùng
        </Link>
      </Typography>
    </main>
  );
}
