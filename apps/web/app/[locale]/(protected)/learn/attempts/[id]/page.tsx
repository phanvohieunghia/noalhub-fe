import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LearnAttempt } from "@/components/learn/learn-attempt";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn/attempts/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.learn" });
  return { title: t("attempt.title") };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/learn/attempts/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.learn">
      <LearnAttempt attemptId={id} />
    </IntlProvider>
  );
}
