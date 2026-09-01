import type { Metadata } from "next";

import { PostEditor } from "@/components/posts/post-editor";

export const metadata: Metadata = { title: "Sửa bài viết" };

/** `params` là async ở Next 16 — await ở server rồi truyền xuống client. */
export default async function EditPostPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  return <PostEditor postId={id} />;
}
