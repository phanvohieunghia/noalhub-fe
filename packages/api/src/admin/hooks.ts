"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as adminApi from "./api";
import type { AdminUserListQuery, GrantStorybookAccessInput } from "./types";

/** Query key factory — the ONLY source of truth for the admin feature's keys. */
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  userList: (query: AdminUserListQuery) =>
    [...adminKeys.users(), "list", query] as const,
  userDetail: (id: string) => [...adminKeys.users(), "detail", id] as const,
  storybookAccess: () => [...adminKeys.all, "storybook-access"] as const,
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

/**
 * Who may open the internal Storybook.
 *
 * No `staleTime`: the list is short, changes rarely, and when it does change the
 * mutations below invalidate it. Refetching on focus is what makes a second
 * admin's grant show up in this tab.
 */
export function useStorybookAccess() {
  return useQuery({
    queryKey: adminKeys.storybookAccess(),
    queryFn: ({ signal }) => adminApi.listStorybookAccess(signal),
  });
}

export function useGrantStorybookAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GrantStorybookAccessInput) =>
      adminApi.grantStorybookAccess(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.storybookAccess() }),
  });
}

export function useRevokeStorybookAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.revokeStorybookAccess(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.storybookAccess() }),
  });
}
