"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { adminUserListQuerySchema, type AdminUserListQuery } from "@noalhub/api/admin";

/**
 * The user table's filters live in the **URL searchParams**, not in component
 * state — so links stay shareable and the browser's back button behaves. The
 * only local state is the search box, because it needs debouncing.
 */
export function useUserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The schema's `.catch()` folds any junk in the URL (`?page=abc`) back to the
  // default — people edit the address bar all the time; that must not break the
  // page.
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

      // A filter change resets to page 1: keeping `page=5` under a new filter is
      // the surest way to get a baffling empty table.
      if (!("page" in next)) params.delete("page");

      router.replace(params.size ? `/users?${params}` : "/users", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  // Debounce the search box: written straight to the URL, every keystroke is a
  // request plus a history entry.
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
