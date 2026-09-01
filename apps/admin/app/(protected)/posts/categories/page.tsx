import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CategoryManager } from "@/components/posts/category-manager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.posts.categories");
  return { title: t("title") };
}

export default function CategoriesPage() {
  return (
    <IntlProvider namespace="admin.posts">
      <CategoryManager />
    </IntlProvider>
  );
}
