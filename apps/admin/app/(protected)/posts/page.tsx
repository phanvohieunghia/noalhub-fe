import type { Metadata } from "next";
import { Suspense } from "react";

import { PostTable } from "@/components/posts/post-table";

export const metadata: Metadata = { title: "Bài viết" };

/**
 * `useSearchParams()` (filter đọc từ URL) bắt buộc nằm dưới một Suspense
 * boundary, nếu không cả route bị ép sang client render lúc build.
 */
export default function PostsPage() {
  return (
    <Suspense>
      <PostTable />
    </Suspense>
  );
}
