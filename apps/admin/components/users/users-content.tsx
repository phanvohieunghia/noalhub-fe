"use client";

import Link from "next/link";

import { useAdminUsers, type AdminUser } from "@noalhub/api/admin";
import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { Badge } from "@noalhub/ui/badge";
import { Input } from "@noalhub/ui/input";
import { Pagination } from "@noalhub/ui/pagination";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@noalhub/ui/table";

import { AdminErrorState } from "../admin-error-state";
import { useUserFilters } from "./use-user-filters";

const COLUMN_COUNT = 5;

export function UsersContent() {
  const { query, searchInput, setSearchInput, setRole, setPage } =
    useUserFilters();
  const users = useAdminUsers(query);

  return (
    <main className="w-full max-w-5xl p-6">
      <h1 className="text-xl font-semibold">Người dùng</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label="Tìm kiếm"
            placeholder="Email hoặc username"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          label="Vai trò"
          placeholder="Tất cả"
          value={query.role ?? ""}
          onChange={(event) => setRole(event.target.value)}
          options={[
            { value: "user", label: "User" },
            { value: "admin", label: "Admin" },
          ]}
        />
      </div>

      {users.isError ? (
        <div className="mt-4">
          <AdminErrorState error={users.error} onRetry={() => users.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption="Danh sách người dùng">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Người dùng</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Vai trò</TableHeaderCell>
                <TableHeaderCell>Tham gia</TableHeaderCell>
                <TableHeaderCell>Hoạt động lần cuối</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.isPending ? (
                <SkeletonRows />
              ) : users.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {query.q || query.role
                    ? "Không có người dùng nào khớp bộ lọc."
                    : "Chưa có người dùng nào."}
                </TableEmptyRow>
              ) : (
                users.data.items.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))
              )}
            </TableBody>
          </TableRoot>

          {users.data ? (
            <Pagination
              page={users.data.page}
              limit={users.data.limit}
              total={users.data.total}
              onPageChange={setPage}
              isLoading={users.isFetching}
            />
          ) : null}
        </div>
      )}
    </main>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/users/${user.id}`}
          className="font-medium hover:underline"
        >
          {user.displayName ?? user.username}
        </Link>
        <span className="block text-xs opacity-60">@{user.username}</span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          {user.email}
          {user.emailVerifiedAt ? null : (
            <Badge tone="warning">Chưa verify</Badge>
          )}
        </span>
      </TableCell>
      <TableCell>
        <Badge tone={user.role === "admin" ? "info" : "neutral"}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(user.createdAt)}
      </TableCell>
      {/* KHÔNG phải trạng thái online — endpoint admin không đọc presence, nên
          ở đây là mốc thời gian, không phải dot xanh/xám. */}
      <TableCell className="whitespace-nowrap opacity-70">
        {user.lastSeenAt ? formatDateTime(user.lastSeenAt) : "Chưa từng online"}
      </TableCell>
    </TableRow>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index} aria-busy="true">
          {Array.from({ length: COLUMN_COUNT }).map((__, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
