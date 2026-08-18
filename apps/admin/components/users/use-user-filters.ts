"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { adminUserListQuerySchema, type AdminUserListQuery } from "@noalhub/api/admin";

/**
 * Filter của bảng user sống trong **URL searchParams**, không trong state của
 * component — nhờ vậy link share được và nút back của trình duyệt đi đúng
 * đường. State cục bộ duy nhất là ô tìm kiếm, vì nó cần debounce.
 */
export function useUserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // `.catch()` trong schema nuốt mọi giá trị rác trên URL (`?page=abc`) về mặc
  // định — người ta sửa tay thanh địa chỉ suốt, đừng để nó làm vỡ trang.
  const query: AdminUserListQuery = adminUserListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    role: searchParams.get("role") ?? undefined,
  });

  const [searchInput, setSearchInput] = useState(query.q ?? "");

  const setParams = useCallback(
    (next: Partial<AdminUserListQuery>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "" || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // Đổi filter thì phải về trang 1: giữ nguyên `page=5` với bộ lọc mới là
      // cách chắc chắn nhất để nhận một bảng rỗng khó hiểu.
      if (!("page" in next)) params.delete("page");

      router.replace(params.size ? `/users?${params}` : "/users", {
        scroll: false,
      });
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
    setRole: (role: string) =>
      setParams({ role: (role || undefined) as AdminUserListQuery["role"] }),
    setPage: (page: number) => setParams({ page }),
  };
}
