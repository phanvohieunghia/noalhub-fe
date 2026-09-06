import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { StorybookAccessContent } from "@/components/storybook/storybook-access-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.storybook");
  return { title: t("title") };
}

/**
 * No `Suspense` wrapper, unlike `/users` and `/posts`: this screen has no
 * filters, so it never calls `useSearchParams()` — the hook that would
 * otherwise force the whole route to client rendering at build time.
 */
export default function StorybookAccessPage() {
  return (
    <IntlProvider namespace="admin.storybook">
      <StorybookAccessContent />
    </IntlProvider>
  );
}
