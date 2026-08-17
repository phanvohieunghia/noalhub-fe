import type { Metadata } from "next";

import { PublicProfileContent } from "@/components/profile/public-profile-content";

export const metadata: Metadata = { title: "Hồ sơ" };

/** `params` là async ở Next 16 — await ở server rồi truyền xuống client. */
export default async function PublicProfilePage(
  props: PageProps<"/profile/[username]">,
) {
  const { username } = await props.params;
  return <PublicProfileContent username={username} />;
}
