import { IntlProvider } from "@noalhub/i18n/provider";
import { RoleGuard } from "@noalhub/ui/auth/role-guard";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AiCredentialsContent } from "@/components/qa/ai-credentials-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.qa");
  return { title: t("credentials.title") };
}

/**
 * A third guard on top of the layout's `admin`: everything here manages the
 * key that gets billed, so it needs `super_admin`.
 *
 * Gating the page rather than each button is deliberate — an `admin` who opens
 * this screen would see a table of 403s, and no arrangement of disabled buttons
 * reads better than one sentence saying why.
 */
export default function AiCredentialsPage() {
  return (
    <IntlProvider namespace="admin.qa">
      <RoleGuard role="super_admin">
        <AiCredentialsContent />
      </RoleGuard>
    </IntlProvider>
  );
}
