import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaItemSearchContent } from "@/components/qa/qa-item-search-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("items.title") };
}

export default function QaItemsPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <QaItemSearchContent />
    </IntlProvider>
  );
}
