import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LearnStats } from "@/components/learn/learn-stats";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn/stats">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.learn" });
  return { title: t("stats.title") };
}

export default async function Page({ params }: PageProps<"/[locale]/learn/stats">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.learn">
      <LearnStats />
    </IntlProvider>
  );
}
