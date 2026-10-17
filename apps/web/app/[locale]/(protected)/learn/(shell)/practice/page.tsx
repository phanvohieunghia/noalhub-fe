import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LearnPractice } from "@/components/learn/learn-practice";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn/practice">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.learn" });
  return { title: t("practice.title") };
}

export default async function Page({ params }: PageProps<"/[locale]/learn/practice">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.learn">
      <LearnPractice />
    </IntlProvider>
  );
}
