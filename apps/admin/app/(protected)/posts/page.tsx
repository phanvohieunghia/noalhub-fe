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
 * `useSearchParams()` (filter đọc từ URL) bắt buộc nằm dưới một Suspense
 * boundary, nếu không cả route bị ép sang client render lúc build.
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
