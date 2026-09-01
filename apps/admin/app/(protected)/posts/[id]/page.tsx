import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PostEditor } from "@/components/posts/post-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.posts");
  return { title: t("editTitle") };
}

/** `params` là async ở Next 16 — await ở server rồi truyền xuống client. */
export default async function EditPostPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;

  return (
    <IntlProvider namespace="admin.posts">
      <PostEditor postId={id} />
    </IntlProvider>
  );
}
