import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.auth.resetPassword" });
  return { title: t("title") };
}

// Next 16: searchParams là Promise, phải await.
export default async function ResetPasswordPage(props: PageProps<"/[locale]/reset-password">) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const { token } = await props.searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
