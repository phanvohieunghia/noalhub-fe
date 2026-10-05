import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaSetDetail } from "@/components/qa/qa-set-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("sets.detailTitle") };
}

export default async function QaSetPage({ params }: PageProps<"/qa/sets/[id]">) {
  const { id } = await params;

  return (
    <IntlProvider namespace="admin.qa">
      <QaSetDetail setId={id} />
    </IntlProvider>
  );
}
