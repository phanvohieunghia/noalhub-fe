import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaItemTagsContent } from "@/components/qa/qa-item-tags-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("tags.title") };
}

export default function QaItemTagsPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <QaItemTagsContent />
    </IntlProvider>
  );
}
