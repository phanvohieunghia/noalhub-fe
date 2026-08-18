import type { Metadata } from "next";

import { UserDetailContent } from "@/components/users/user-detail-content";

export const metadata: Metadata = { title: "Chi tiết người dùng" };

/** `params` là async ở Next 16 — await ở server rồi truyền xuống client. */
export default async function AdminUserDetailPage(
  props: PageProps<"/users/[id]">,
) {
  const { id } = await props.params;
  return <UserDetailContent userId={id} />;
}
