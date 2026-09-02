"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as adminApi from "./api";
import type { AdminUserListQuery } from "./types";

/** Query key factory — the ONLY source of truth for the admin feature's keys. */
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  userList: (query: AdminUserListQuery) =>
    [...adminKeys.users(), "list", query] as const,
  userDetail: (id: string) => [...adminKeys.users(), "detail", id] as const,
};

/**
 * Overview statistics.
 *
 * A short `staleTime` (15s) because the backend does not cache and the counts
 * change constantly — but this is **not** realtime: the screen must offer a
 * refresh button rather than pretending to be a stream.
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: ({ signal }) => adminApi.getAdminStats(signal),
    staleTime: 15_000,
  });
}

/**
 * The user list, offset-paginated.
 *
 * `placeholderData: keepPreviousData` keeps the table from flashing back to a
 * skeleton on every page change or keystroke in the search box — the old page
 * stays until the new one arrives.
 */
export function useAdminUsers(query: AdminUserListQuery = {}) {
  return useQuery({
    queryKey: adminKeys.userList(query),
    queryFn: ({ signal }) => adminApi.listAdminUsers(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.userDetail(id ?? ""),
    queryFn: ({ signal }) => adminApi.getAdminUser(id!, signal),
    enabled: Boolean(id),
  });
}
