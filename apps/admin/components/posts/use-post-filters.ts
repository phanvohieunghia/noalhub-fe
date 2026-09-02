"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { adminBlogPostQuerySchema, type AdminBlogPostQuery } from "@noalhub/api/blog";

/**
 * The post table's filters live in the **URL searchParams**, not in state — so
 * links stay shareable and the back button behaves. Shaped like
 * `use-user-filters`; two separate hooks because the two tables have different
 * filter sets (`status` vs `role`).
 */
export function usePostFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The schema's `.catch()` folds any junk in the URL (`?page=abc`) back to the
  // default — people edit the address bar all the time; that must not break the
  // page.
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

      // A filter change resets to page 1: keeping `page=5` under a new filter is
      // the surest way to get a baffling empty table.
      if (!("page" in next)) params.delete("page");

      router.replace(params.size ? `/posts?${params}` : "/posts", { scroll: false });
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
    setStatus: (status: string) =>
      setParams({ status: (status || undefined) as AdminBlogPostQuery["status"] }),
    setPage: (page: number) => setParams({ page }),
  };
}
