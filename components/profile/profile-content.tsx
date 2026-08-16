"use client";

import Link from "next/link";

import { ChangeUsernameForm } from "@/components/profile/change-username-form";
import { Avatar } from "@/components/ui/avatar";
import { FormError } from "@/components/ui/form-error";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/lib/auth/store";
import { formatDate } from "@/lib/format-date";
import { useMe } from "@/services/auth/hooks";
import type { User } from "@/services/users/types";

/**
 * Hồ sơ của chính mình.
 *
 * Backend chưa có endpoint đọc hồ sơ người khác (spec chỉ có `/auth/me` và
 * `PATCH /users/me/username`), nên trang này mới chỉ phục vụ user hiện tại.
 */
export function ProfileContent() {
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
          className="flex flex-1 items-center justify-center gap-2 p-8 text-sm opacity-70"
        >
          <Spinner />
          Đang tải hồ sơ…
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-3xl p-8">
        <FormError message={error ? "Không tải được hồ sơ." : "Không có dữ liệu hồ sơ."} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <header className="flex items-center gap-4">
        <Avatar name={user.displayName ?? user.username} src={user.avatarUrl} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">
            {user.displayName ?? user.username}
          </h1>
          <p className="truncate font-mono text-sm opacity-70">@{user.username}</p>
        </div>
        <Link
          href="/dashboard"
          className="ml-auto inline-flex h-10 items-center rounded-md border border-black/15 px-4 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Dashboard
        </Link>
      </header>

      <ProfileFacts user={user} />

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <h2 className="text-lg font-semibold">Đổi username</h2>
        <ChangeUsernameForm user={user} />
      </section>
    </main>
  );
}

function ProfileFacts({ user }: { user: User }) {
  return (
    <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
      <Fact label="Email">
        <span className="font-mono">{user.email}</span>{" "}
        {user.emailVerified ? (
          <span className="text-green-700 dark:text-green-400">· đã xác thực</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-400">· chưa xác thực</span>
        )}
      </Fact>
      <Fact label="Vai trò">{user.role === "admin" ? "Quản trị viên" : "Thành viên"}</Fact>
      <Fact label="Tham gia">{formatDate(user.createdAt)}</Fact>
      <Fact label="Đổi username lần cuối">
        {user.usernameChangedAt ? formatDate(user.usernameChangedAt) : "Chưa từng đổi"}
      </Fact>
      <Fact label="User ID">
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
