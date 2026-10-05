import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LearnSet } from "@/components/learn/learn-set";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn/sets/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.learn" });
  return { title: t("set.title") };
}

export default async function Page({
  params,
}: PageProps<"/[locale]/learn/sets/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.learn">
      <LearnSet setId={id} />
    </IntlProvider>
  );
}
