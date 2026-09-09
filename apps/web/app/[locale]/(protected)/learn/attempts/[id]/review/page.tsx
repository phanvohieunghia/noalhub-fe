import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LearnReview } from "@/components/learn/learn-review";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn/attempts/[id]/review">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.learn" });
  return { title: t("review.title") };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/learn/attempts/[id]/review">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.learn">
      <LearnReview attemptId={id} />
    </IntlProvider>
  );
}
