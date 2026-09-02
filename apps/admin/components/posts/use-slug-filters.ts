"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  adminBlogSlugQuerySchema,
  type AdminBlogSlugQuery,
} from "@noalhub/api/blog";

/**
 * Filters for `/posts/slugs`, kept in the URL for the same reasons as
 * `usePostFilters` — shareable links, a working back button.
 *
 * `postId` is read but never written here: it arrives from the editor's
 * "manage old URLs" link (`docs/slug-management.md` §5.3) and stays put while
 * the user pages or sorts, so the screen keeps showing the post they came from.
 */
export function useSlugFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query: AdminBlogSlugQuery = adminBlogSlugQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    postId: searchParams.get("postId") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
  });

  const [searchInput, setSearchInput] = useState(query.q ?? "");

  // Read straight from the URL rather than from `query`: the schema `.catch()`es
  // a missing `sort` back to "created", so the parsed value cannot tell "the
  // user sorted by created" from "the user sorted by nothing" — and the header
  // has to show a neutral icon for the second one.
  const activeSort = searchParams.get("sort");
  const activeOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

  const setParams = useCallback(
    (next: Partial<AdminBlogSlugQuery>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "" || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // Any filter change resets to page 1 — `page=5` under a new filter is the
      // surest way to land on a baffling empty table.
      if (!("page" in next)) params.delete("page");

      router.replace(params.size ? `/posts/slugs?${params}` : "/posts/slugs", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const current = query.q ?? "";
    const next = searchInput.trim();
    if (next === current) return;

    const timer = setTimeout(() => setParams({ q: next || undefined }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, query.q, setParams]);

  /** asc → desc → off, per column. See `TableSortHeaderCell`. */
  const toggleSort = useCallback(
    (sort: NonNullable<AdminBlogSlugQuery["sort"]>) => {
      if (activeSort !== sort) return setParams({ sort, order: "asc" });
      if (activeOrder === "asc") return setParams({ sort, order: "desc" });
      setParams({ sort: undefined, order: undefined });
    },
    [activeSort, activeOrder, setParams],
  );

  const directionOf = (sort: AdminBlogSlugQuery["sort"]) =>
    activeSort === sort ? activeOrder : (false as const);

  return {
    query,
    toggleSort,
    directionOf,
    searchInput,
    setSearchInput,
    clearPostFilter: () => setParams({ postId: undefined }),
    setPage: (page: number) => setParams({ page }),
  };
}
