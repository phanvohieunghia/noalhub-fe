import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FriendListContent } from "@/components/friends/friend-list-content";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/friends">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.friends" });
  return { title: t("title") };
}

export default async function FriendsPage({ params }: PageProps<"/[locale]/friends">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.friends">
      <FriendListContent />
    </IntlProvider>
  );
}
