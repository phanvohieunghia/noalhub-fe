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

/** `params` is async in Next 16 — await it on the server, then pass it down to the client. */
export default async function PublicProfilePage(props: PageProps<"/[locale]/profile/[username]">) {
  const { locale, username } = await props.params;
  setRequestLocale(locale);

  /*
   * `web.chat` comes along because `PublicProfileContent` uses `useChatFormat()`
   * for the "last active" line — the same phrasing as in chat, hence the same
   * namespace.
   */
  return (
    <IntlProvider namespace="web.profile">
      <IntlProvider namespace="web.chat">
        <PublicProfileContent username={username} />
      </IntlProvider>
    </IntlProvider>
  );
}
