"use client";

import Link from "next/link";

import { useAdminBlogPosts, type BlogPost } from "@noalhub/api/blog";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import { Button } from "@noalhub/ui/button";
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
import { PostStatusBadge } from "./post-status-badge";
import { usePostFilters } from "./use-post-filters";
import { Typography } from "@noalhub/ui/typography";

const COLUMN_COUNT = 5;

/**
 * The post administration table (`docs/blog.md` §7.1).
 *
 * It uses `Pagination` (buttons, client state), NOT `PaginationLinks`: this
 * screen is behind login, `robots` blocks everything, and no crawler needs a
 * path through. The `<a href>` version is for the public pages (§4.5).
 */
export function PostTable() {
  const t = useTranslations("admin.posts");
  const { query, searchInput, setSearchInput, setStatus, setPage } = usePostFilters();
  const posts = useAdminBlogPosts(query);

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h4" as="h1">
          {t("title")}
        </Typography>
        <div className="flex items-center gap-2">
          {/* `asChild`: the Link IS the button, rather than a button wrapping a link. */}
          <Button variant="outline" asChild>
            <Link href="/posts/categories">{t("table.categories")}</Link>
          </Button>
          <Button asChild>
            <Link href="/posts/new">{t("table.new")}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label={t("table.search")}
            placeholder={t("table.searchPlaceholder")}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          label={t("table.statusLabel")}
          placeholder={t("table.allStatuses")}
          value={query.status ?? ""}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: "draft", label: t("status.draft") },
            { value: "published", label: t("status.published") },
            { value: "archived", label: t("status.archived") },
          ]}
        />
      </div>

      {posts.isError ? (
        <div className="mt-4">
          <AdminErrorState error={posts.error} onRetry={() => posts.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("table.caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("table.columns.title")}</TableHeaderCell>
                <TableHeaderCell>{t("table.columns.status")}</TableHeaderCell>
                <TableHeaderCell>{t("table.columns.category")}</TableHeaderCell>
                <TableHeaderCell>{t("table.columns.author")}</TableHeaderCell>
                <TableHeaderCell>{t("table.columns.updatedAt")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.isPending ? (
                <SkeletonRows />
              ) : posts.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {query.q || query.status
                    ? t("table.emptyFiltered")
                    : t("table.empty")}
                </TableEmptyRow>
              ) : (
                posts.data.items.map((post) => <PostRow key={post.id} post={post} />)
              )}
            </TableBody>
          </TableRoot>

          {posts.data ? (
            <Pagination
              page={posts.data.page}
              limit={posts.data.limit}
              total={posts.data.total}
              onPageChange={setPage}
              isLoading={posts.isFetching}
            />
          ) : null}
        </div>
      )}
    </main>
  );
}

function PostRow({ post }: { post: BlogPost }) {
  const t = useTranslations("admin.posts");
  const df = useDateFormat();

  return (
    <TableRow>
      <TableCell>
        <Link href={`/posts/${post.id}`} className="font-medium hover:underline">
          {post.title}
        </Link>
        <Typography variant="body-4" as="span" className="block opacity-60">
          /{post.slug}
        </Typography>
      </TableCell>
      <TableCell>
        <PostStatusBadge status={post.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {/* `null` is only valid for drafts — publishing requires a category (§2.6). */}
        {post.category?.name ?? <span className="opacity-40">{t("table.noCategory")}</span>}
      </TableCell>
      <TableCell className="whitespace-nowrap">{post.author.displayName}</TableCell>
      {/* This table sorts by `updatedAt DESC`, unlike the public list
          (`publishedAt DESC`) — so the column shows what is actually sorted on
          (§2.1a). */}
      <TableCell className="whitespace-nowrap opacity-70">
        {df.dateTime(post.updatedAt)}
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
