import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

/**
 * `getTranslations`, not `useTranslations`: `generateMetadata` runs outside the
 * React tree, where no hook exists (`docs/i18n.md` §7.3).
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.auth.login" });
  return { title: t("title") };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);

  // LoginForm uses useSearchParams (reading ?next=) → a Suspense boundary is required.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
