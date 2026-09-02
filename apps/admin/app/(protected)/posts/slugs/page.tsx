import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SlugTable } from "@/components/posts/slug-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.posts.slugs");
  return { title: t("title") };
}

export default function SlugsPage() {
  return (
    <IntlProvider namespace="admin.posts">
      <SlugTable />
    </IntlProvider>
  );
}
