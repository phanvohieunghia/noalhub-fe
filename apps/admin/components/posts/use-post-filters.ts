"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { adminBlogPostQuerySchema, type AdminBlogPostQuery } from "@noalhub/api/blog";

/**
 * Filter của bảng bài viết sống trong **URL searchParams**, không trong state —
 * link share được và nút back đi đúng đường. Cùng khuôn với `use-user-filters`;
 * hai hook riêng vì hai bảng có tập filter khác nhau (`status` vs `role`).
 */
export function usePostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // `.catch()` trong schema nuốt mọi giá trị rác trên URL (`?page=abc`) về mặc
  // định — người ta sửa tay thanh địa chỉ suốt, đừng để nó làm vỡ trang.
  const query: AdminBlogPostQuery = adminBlogPostQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  const [searchInput, setSearchInput] = useState(query.q ?? "");

  const setParams = useCallback(
    (next: Partial<AdminBlogPostQuery>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "" || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // Đổi filter thì phải về trang 1: giữ `page=5` với bộ lọc mới là cách
      // chắc chắn nhất để nhận một bảng rỗng khó hiểu.
      if (!("page" in next)) params.delete("page");

      router.replace(params.size ? `/posts?${params}` : "/posts", { scroll: false });
    },
    [router, searchParams],
  );

  // Debounce ô tìm kiếm: mỗi phím là một request + một entry lịch sử nếu ghi
  // thẳng vào URL.
  useEffect(() => {
    const current = query.q ?? "";
    const next = searchInput.trim();
    if (next === current) return;

    const timer = setTimeout(() => setParams({ q: next || undefined }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, query.q, setParams]);

  return {
    query,
    searchInput,
    setSearchInput,
    setStatus: (status: string) =>
      setParams({ status: (status || undefined) as AdminBlogPostQuery["status"] }),
    setPage: (page: number) => setParams({ page }),
  };
}
