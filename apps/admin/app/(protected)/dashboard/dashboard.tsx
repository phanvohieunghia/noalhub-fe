"use client";

import { useMe } from "@noalhub/api/auth";
import { formatDate } from "@noalhub/core/format-date";
import { Spinner } from "@noalhub/ui/spinner";

/**
 * Màn hình tối thiểu để chứng minh chuỗi liên kết chạy end-to-end:
 * admin → `@noalhub/api` → backend NestJS, dùng chung token store với web
 * nhưng ở origin riêng nên phiên KHÔNG lẫn sang nhau.
 */
export function AdminDashboard() {
  const me = useMe();

  if (me.isPending) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Bảng điều khiển</h1>
      <dl className="mt-6 grid grid-cols-[8rem_1fr] gap-2 text-sm">
        <dt className="opacity-70">Email</dt>
        <dd>{me.data?.email}</dd>
        <dt className="opacity-70">Username</dt>
        <dd>{me.data?.username ?? "—"}</dd>
        <dt className="opacity-70">Tham gia</dt>
        <dd>{me.data?.createdAt ? formatDate(me.data.createdAt) : "—"}</dd>
      </dl>
    </main>
  );
}
