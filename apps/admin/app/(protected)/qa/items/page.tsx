import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaItemSearchContent } from "@/components/qa/qa-item-search-content";
import { QaItemTypesContent } from "@/components/qa/qa-item-types-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("items.title") };
}

/** `/qa/items` lists the question types; `?type=…` lists the questions of one. */
export default async function QaItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;
  const selected = Array.isArray(type) ? type[0] : type;

  return (
    <IntlProvider namespace="admin.qa">
      {selected ? <QaItemSearchContent type={selected} /> : <QaItemTypesContent />}
    </IntlProvider>
  );
}
