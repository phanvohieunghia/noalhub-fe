"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as adminApi from "./api";
import type { AdminQaPeriod, AdminSignupRange, AdminUserListQuery, GrantStorybookAccessInput } from "./types";

/** Query key factory — the ONLY source of truth for the admin feature's keys. */
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  signups: (range: AdminSignupRange) =>
    [...adminKeys.all, "signups", range] as const,
  qaQuestions: (datasetId: string, period: AdminQaPeriod, userId?: string) =>
    [...adminKeys.all, "qa-questions", datasetId, period, userId ?? "all"] as const,
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
 * New users over time, for the overview charts. Same freshness policy as
 * `useAdminStats`; the previous range stays on screen while a new one loads so
 * switching week / month / year does not flash a skeleton.
 */
export function useAdminSignups(range: AdminSignupRange) {
  return useQuery({
    queryKey: adminKeys.signups(range),
    queryFn: ({ signal }) => adminApi.getAdminSignups(range, signal),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Per-question answer counts of one dataset, summed over every user (or
 * only `userId`'s). Same
 * freshness policy as `useAdminStats`; switching period keeps the old bars up
 * until the new ones arrive.
 */
export function useAdminQaQuestionStats(
  datasetId: string | undefined,
  period: AdminQaPeriod,
  userId?: string,
) {
  return useQuery({
    queryKey: adminKeys.qaQuestions(datasetId ?? "", period, userId),
    queryFn: ({ signal }) =>
      adminApi.getAdminQaQuestionStats(datasetId!, period, userId, signal),
    enabled: Boolean(datasetId),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
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
