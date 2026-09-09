import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LearnBrowse } from "@/components/learn/learn-browse";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.learn" });
  return { title: t("browse.title") };
}

export default async function Page({ params }: PageProps<"/[locale]/learn">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.learn">
      <LearnBrowse />
    </IntlProvider>
  );
}
