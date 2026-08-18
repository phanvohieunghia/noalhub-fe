"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as adminApi from "./api";
import type { AdminUserListQuery } from "./types";

/** Query key factory — nguồn sự thật DUY NHẤT cho key của feature admin. */
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  userList: (query: AdminUserListQuery) =>
    [...adminKeys.users(), "list", query] as const,
  userDetail: (id: string) => [...adminKeys.users(), "detail", id] as const,
};

/**
 * Số liệu tổng quan.
 *
 * `staleTime` ngắn (15s) vì backend không cache và số đếm đổi liên tục — nhưng
 * đây **không** phải realtime: màn hình phải có nút refresh, đừng vẽ như stream.
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: ({ signal }) => adminApi.getAdminStats(signal),
    staleTime: 15_000,
  });
}

/**
 * Danh sách user, phân trang offset.
 *
 * `placeholderData: keepPreviousData` để bảng không nháy về skeleton mỗi lần
 * đổi trang hay gõ ô tìm kiếm — trang cũ ở lại tới khi trang mới về.
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
