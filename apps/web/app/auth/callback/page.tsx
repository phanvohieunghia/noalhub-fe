import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { OAuthCallback } from "@/components/auth/oauth-callback";
import { Typography } from "@noalhub/ui/typography";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("web.auth.oauth");
  return { title: t("pageTitle") };
}

export default async function OAuthCallbackPage() {
  const t = await getTranslations("web.auth.oauth");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense
        fallback={
          <Typography variant="body-3" className="opacity-70">
            {t("processing")}
          </Typography>
        }
      >
        <OAuthCallback />
      </Suspense>
    </main>
  );
}
