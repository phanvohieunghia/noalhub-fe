import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaSetsContent } from "@/components/qa/qa-sets-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("sets.title") };
}

export default function QaSetsPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <QaSetsContent />
    </IntlProvider>
  );
}
