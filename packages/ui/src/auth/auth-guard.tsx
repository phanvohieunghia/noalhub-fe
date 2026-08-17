"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@noalhub/api/auth";

/**
 * Bảo vệ route ở phía client. Token nằm trong localStorage/memory nên
 * proxy.ts (server) không thấy được — xem docs/auth.md §1.2.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") return <AuthSkeleton />;

  return <>{children}</>;
}

function AuthSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-3xl animate-pulse space-y-4 p-8"
      aria-busy="true"
    >
      <div className="h-8 w-48 rounded bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-2/3 rounded bg-black/10 dark:bg-white/10" />
    </div>
  );
}
