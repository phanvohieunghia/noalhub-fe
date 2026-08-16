import type { Metadata } from "next";

import { FriendListContent } from "@/components/friends/friend-list-content";

export const metadata: Metadata = { title: "Bạn bè" };

export default function FriendsPage() {
  return <FriendListContent />;
}
