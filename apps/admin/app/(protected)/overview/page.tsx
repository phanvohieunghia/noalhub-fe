import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { OverviewContent } from "@/components/overview/overview-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.overview");
  return { title: t("title") };
}

export default function OverviewPage() {
  return (
    <IntlProvider namespace="admin.overview">
      <OverviewContent />
    </IntlProvider>
  );
}
