"use client";

import Link from "next/link";

import { useAdminBlogPosts, type BlogPost } from "@noalhub/api/blog";
import { formatDateTime } from "@noalhub/core/format-date";
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
 * Bảng quản trị bài viết (`docs/blog-plan.md` §7.1).
 *
 * Dùng `Pagination` (nút bấm, giữ state client) chứ KHÔNG phải
 * `PaginationLinks`: đây là màn hình sau đăng nhập, `robots` chặn hết, không có
 * crawler nào cần đi qua. Bản `<a href>` là cho trang công khai (§4.5).
 */
export function PostTable() {
  const { query, searchInput, setSearchInput, setStatus, setPage } = usePostFilters();
  const posts = useAdminBlogPosts(query);

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h4" as="h1">
          Bài viết
        </Typography>
        <div className="flex items-center gap-2">
          <Link
            href="/posts/categories"
            className="inline-flex h-10 items-center rounded-md border border-black/15 px-4 text-body-3 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Chuyên mục
          </Link>
          <Link
            href="/posts/new"
            className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-body-3 font-medium text-background transition-opacity hover:opacity-90"
          >
            Viết bài mới
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label="Tìm kiếm"
            placeholder="Tiêu đề hoặc slug"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          label="Trạng thái"
          placeholder="Tất cả"
          value={query.status ?? ""}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: "draft", label: "Nháp" },
            { value: "published", label: "Đã đăng" },
            { value: "archived", label: "Đã gỡ" },
          ]}
        />
      </div>

      {posts.isError ? (
        <div className="mt-4">
          <AdminErrorState error={posts.error} onRetry={() => posts.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption="Danh sách bài viết">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tiêu đề</TableHeaderCell>
                <TableHeaderCell>Trạng thái</TableHeaderCell>
                <TableHeaderCell>Chuyên mục</TableHeaderCell>
                <TableHeaderCell>Tác giả</TableHeaderCell>
                <TableHeaderCell>Cập nhật</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.isPending ? (
                <SkeletonRows />
              ) : posts.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {query.q || query.status
                    ? "Không có bài viết nào khớp bộ lọc."
                    : "Chưa có bài viết nào. Bấm “Viết bài mới” để bắt đầu."}
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
        {/* `null` chỉ hợp lệ với bài nháp — publish bắt buộc có chuyên mục (§2.6). */}
        {post.category?.name ?? <span className="opacity-40">— chưa chọn</span>}
      </TableCell>
      <TableCell className="whitespace-nowrap">{post.author.displayName}</TableCell>
      {/* Sort của bảng này là `updatedAt DESC`, khác public (`publishedAt DESC`) —
          nên cột hiện đúng thứ đang được sort (§2.1a). */}
      <TableCell className="whitespace-nowrap opacity-70">
        {formatDateTime(post.updatedAt)}
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
