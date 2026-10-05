import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaDatasetsContent } from "@/components/qa/qa-datasets-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("datasets.title") };
}

export default function QaDatasetsPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <QaDatasetsContent />
    </IntlProvider>
  );
}
