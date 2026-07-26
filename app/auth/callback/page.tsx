import { Suspense } from "react";
import type { Metadata } from "next";

import { OAuthCallback } from "@/components/auth/oauth-callback";

export const metadata: Metadata = { title: "Đang đăng nhập…" };

export default function OAuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={<p className="text-sm opacity-70">Đang xử lý…</p>}>
        <OAuthCallback />
      </Suspense>
    </main>
  );
}
