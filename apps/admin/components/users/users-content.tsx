"use client";

import Link from "next/link";

import { useAdminUsers, type AdminUser } from "@noalhub/api/admin";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
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
import { Typography } from "@noalhub/ui/typography";

const COLUMN_COUNT = 5;

export function UsersContent() {
  const t = useTranslations("admin.users");
  const { query, searchInput, setSearchInput, setRole, setPage } = useUserFilters();
  const users = useAdminUsers(query);

  return (
    <main className="w-full p-6">
      <Typography variant="h4" as="h1">
        {t("title")}
      </Typography>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          label={t("role")}
          placeholder={t("allRoles")}
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
          <TableRoot caption={t("tableCaption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("columns.user")}</TableHeaderCell>
                <TableHeaderCell>{t("columns.email")}</TableHeaderCell>
                <TableHeaderCell>{t("columns.role")}</TableHeaderCell>
                <TableHeaderCell>{t("columns.joined")}</TableHeaderCell>
                <TableHeaderCell>{t("columns.lastSeen")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.isPending ? (
                <SkeletonRows />
              ) : users.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {query.q || query.role ? t("emptyFiltered") : t("empty")}
                </TableEmptyRow>
              ) : (
                users.data.items.map((user) => <UserRow key={user.id} user={user} />)
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
  const t = useTranslations("admin.users");
  const df = useDateFormat();

  return (
    <TableRow>
      <TableCell>
        <Link href={`/users/${user.id}`} className="font-medium hover:underline">
          {user.displayName ?? user.username}
        </Link>
        <Typography variant="body-4" as="span" className="block opacity-60">
          @{user.username}
        </Typography>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          {user.email}
          {user.emailVerifiedAt ? null : <Badge tone="warning">{t("unverified")}</Badge>}
        </span>
      </TableCell>
      <TableCell>
        <Badge tone={user.role === "admin" ? "info" : "neutral"}>{user.role}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">{df.date(user.createdAt)}</TableCell>
      {/* NOT an online state — the admin endpoints do not read presence, so this
          is a timestamp, never a green/gray dot. */}
      <TableCell className="whitespace-nowrap opacity-70">
        {user.lastSeenAt ? df.dateTime(user.lastSeenAt) : t("neverOnline")}
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
