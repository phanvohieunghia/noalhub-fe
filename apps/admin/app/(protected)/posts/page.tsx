import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PostTable } from "@/components/posts/post-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.posts");
  return { title: t("title") };
}

/**
 * `useSearchParams()` (the filters read from the URL) must sit under a Suspense
 * boundary, or the whole route is forced to client rendering at build time.
 */
export default function PostsPage() {
  return (
    <IntlProvider namespace="admin.posts">
      <Suspense>
        <PostTable />
      </Suspense>
    </IntlProvider>
  );
}
