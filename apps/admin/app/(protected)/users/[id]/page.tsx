import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UserDetailContent } from "@/components/users/user-detail-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.users");
  return { title: t("detailTitle") };
}

/** `params` is async in Next 16 — await it on the server, then pass it down to the client. */
export default async function AdminUserDetailPage(props: PageProps<"/users/[id]">) {
  const { id } = await props.params;

  return (
    <IntlProvider namespace="admin.users">
      <UserDetailContent userId={id} />
    </IntlProvider>
  );
}
