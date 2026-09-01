import type { Metadata } from "next";

import { NewPostRedirect } from "@/components/posts/new-post-redirect";

export const metadata: Metadata = { title: "Bài mới" };

export default function NewPostPage() {
  return <NewPostRedirect />;
}
