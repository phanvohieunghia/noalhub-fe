import { Suspense } from "react";
import type { Metadata } from "next";

import { OAuthCallback } from "@/components/auth/oauth-callback";
import { Typography } from "@noalhub/ui/typography";

export const metadata: Metadata = { title: "Đang đăng nhập…" };

export default function OAuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense
        fallback={
          <Typography variant="body-3" className="opacity-70">
            Đang xử lý…
          </Typography>
        }
      >
        <OAuthCallback />
      </Suspense>
    </main>
  );
}
