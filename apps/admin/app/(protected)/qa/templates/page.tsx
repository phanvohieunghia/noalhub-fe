import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { QaTemplatesContent } from "@/components/qa/qa-templates-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("templates.title") };
}

/**
 * `admin`, not `super_admin`: writing a prompt calls no provider and produces no
 * invoice. The boundary is "does it get billed", not "is it AI-related".
 */
export default function QaTemplatesPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <QaTemplatesContent />
    </IntlProvider>
  );
}
