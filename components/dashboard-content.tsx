"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { useAuthStore } from "@/lib/auth/store";

/** Trang mẫu để verify luồng auth end-to-end. */
export function DashboardContent() {
  const user = useAuthStore((s) => s.user);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm opacity-70">Xin chào, {user?.displayName ?? user?.email ?? "bạn"}.</p>
        </div>
        <LogoutButton />
      </div>

      <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">Email</dt>
          <dd className="font-mono">{user?.email ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="opacity-70">User ID</dt>
          <dd className="font-mono">{user?.id ?? "—"}</dd>
        </div>
      </dl>
    </main>
  );
}
