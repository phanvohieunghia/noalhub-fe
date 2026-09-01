import { IntlProvider } from "@noalhub/i18n/provider";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicProfileContent } from "@/components/profile/public-profile-content";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile/[username]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.profile" });
  return { title: t("title") };
}

/** `params` là async ở Next 16 — await ở server rồi truyền xuống client. */
export default async function PublicProfilePage(props: PageProps<"/[locale]/profile/[username]">) {
  const { locale, username } = await props.params;
  setRequestLocale(locale);

  /*
   * `web.chat` đi kèm vì `PublicProfileContent` dùng `useChatFormat()` cho dòng
   * "hoạt động gần nhất" — cùng một cách nói với trong chat, nên cùng namespace.
   */
  return (
    <IntlProvider namespace="web.profile">
      <IntlProvider namespace="web.chat">
        <PublicProfileContent username={username} />
      </IntlProvider>
    </IntlProvider>
  );
}
