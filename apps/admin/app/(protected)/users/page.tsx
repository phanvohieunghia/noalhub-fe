import type { Metadata } from "next";
import { Suspense } from "react";

import { UsersContent } from "@/components/users/users-content";

export const metadata: Metadata = { title: "Người dùng" };

/**
 * `useSearchParams()` (filter đọc từ URL) bắt buộc nằm dưới một Suspense
 * boundary, nếu không cả route bị ép sang client render lúc build.
 */
export default function UsersPage() {
  return (
    <Suspense>
      <UsersContent />
    </Suspense>
  );
}
