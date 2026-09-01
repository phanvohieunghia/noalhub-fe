import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewPostRedirect } from "@/components/posts/new-post-redirect";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.posts");
  return { title: t("newTitle") };
}

export default function NewPostPage() {
  return (
    <IntlProvider namespace="admin.posts">
      <NewPostRedirect />
    </IntlProvider>
  );
}
