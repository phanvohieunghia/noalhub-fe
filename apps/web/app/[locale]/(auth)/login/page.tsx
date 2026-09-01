import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

/**
 * `getTranslations` chứ không `useTranslations`: `generateMetadata` chạy ngoài
 * cây React, không có hook nào ở đó (`docs/i18n-plan.md` §7.3).
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.auth.login" });
  return { title: t("title") };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);

  // LoginForm dùng useSearchParams (đọc ?next=) → bắt buộc có Suspense boundary.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
