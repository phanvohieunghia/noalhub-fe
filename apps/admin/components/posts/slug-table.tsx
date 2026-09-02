"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useAdminBlogSlugs,
  useDeleteAdminBlogSlug,
  useUpdateAdminBlogSlug,
  type BlogPostSlug,
} from "@noalhub/api/blog";
import type { Message } from "@noalhub/api/message";
import { blogErrorText } from "@noalhub/core/blog/error-message";
import { slugify } from "@noalhub/core/blog/slugify";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useMessage } from "@noalhub/i18n/use-message";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { Pagination } from "@noalhub/ui/pagination";
import { Skeleton } from "@noalhub/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableSortHeaderCell,
} from "@noalhub/ui/table";
import { Typography } from "@noalhub/ui/typography";
import { useTranslations } from "next-intl";

import { AdminErrorState } from "../admin-error-state";
import { PostStatusBadge } from "./post-status-badge";
import { useSlugFilters } from "./use-slug-filters";

const COLUMN_COUNT = 4;

/**
 * The old-URL table (`docs/slug-management.md` §5.2).
 *
 * Answers the reverse question — an old URL in hand, which post is it? — which
 * is why the endpoint behind it is flat rather than nested under a post.
 *
 * There is no "add" button anywhere on this screen: aliases only ever appear one
 * way, automatically, when a published post's slug changes. Letting anyone type
 * one in by hand is how an old URL ends up pointing at the wrong post.
 */
export function SlugTable() {
  const t = useTranslations("admin.posts.slugs");
  const {
    query,
    searchInput,
    setSearchInput,
    toggleSort,
    directionOf,
    clearPostFilter,
    setPage,
  } = useSlugFilters();
  const slugs = useAdminBlogSlugs(query);

  const [editing, setEditing] = useState<BlogPostSlug | null>(null);
  const [deleting, setDeleting] = useState<BlogPostSlug | null>(null);

  // The post filter arrives from the editor's link, so the name of the post has
  // to come from the rows themselves — there is no separate post query here.
  const filteredPost = query.postId ? slugs.data?.items[0]?.post : undefined;

  return (
    <main className="w-full p-6">
      <Typography variant="h4" as="h1">
        {t("title")}
      </Typography>
      <Typography variant="body-3" className="mt-1 max-w-2xl opacity-70">
        {t("description")}
      </Typography>

      {query.postId ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Typography variant="body-3" as="span">
            {t("filteredByPost", { title: filteredPost?.title ?? "" })}
          </Typography>
          <Button variant="ghost" size="sm" onClick={clearPostFilter}>
            {t("clearPostFilter")}
          </Button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </div>

      {slugs.isError ? (
        <div className="mt-4">
          <AdminErrorState error={slugs.error} onRetry={() => slugs.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("caption")}>
            <TableHead>
              <TableRow>
                <TableSortHeaderCell
                  direction={directionOf("slug")}
                  onToggle={() => toggleSort("slug")}
                  sortHint={t("sortHint", { column: t("columns.oldUrl") })}
                >
                  {t("columns.oldUrl")}
                </TableSortHeaderCell>
                <TableHeaderCell>{t("columns.post")}</TableHeaderCell>
                <TableSortHeaderCell
                  direction={directionOf("created")}
                  onToggle={() => toggleSort("created")}
                  sortHint={t("sortHint", { column: t("columns.createdAt") })}
                >
                  {t("columns.createdAt")}
                </TableSortHeaderCell>
                <TableHeaderCell>{t("columns.actions")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slugs.isPending ? (
                <SkeletonRows />
              ) : slugs.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {query.q || query.postId ? t("emptyFiltered") : t("empty")}
                </TableEmptyRow>
              ) : (
                slugs.data.items.map((row) => (
                  <SlugRow
                    key={row.id}
                    row={row}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>

          {slugs.data ? (
            <Pagination
              page={slugs.data.page}
              limit={slugs.data.limit}
              total={slugs.data.total}
              onPageChange={setPage}
              isLoading={slugs.isFetching}
            />
          ) : null}
        </div>
      )}

      {editing ? (
        <EditSlugDialog row={editing} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? (
        <DeleteSlugDialog row={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </main>
  );
}

function SlugRow({
  row,
  onEdit,
  onDelete,
}: {
  row: BlogPostSlug;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("admin.posts.slugs");
  const df = useDateFormat();

  return (
    <TableRow>
      <TableCell className="font-medium">/blogs/{row.slug}</TableCell>
      <TableCell>
        <Link href={`/posts/${row.post.id}`} className="hover:underline">
          {row.post.title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <PostStatusBadge status={row.post.status} />
          <Typography variant="body-4" as="span" className="opacity-60">
            /blogs/{row.post.slug}
          </Typography>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap opacity-70">
        {df.dateTime(row.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            {t("actions.edit")}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            {t("actions.delete")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Editing an alias is NOT a rename — it kills a URL that is live in Google's
 * index and puts a brand-new one in its place. So the dialog has two phases:
 * type the new slug, then confirm by typing the OLD one back.
 *
 * That second phase is the whole safety design (§4.2). Nothing counts the hits
 * an old URL still gets, so the system cannot warn "this one is still busy" —
 * the only thing between a reflex click and a dead URL is having to read the
 * string out loud, so to speak.
 */
function EditSlugDialog({
  row,
  onClose,
}: {
  row: BlogPostSlug;
  onClose: () => void;
}) {
  const t = useTranslations("admin.posts.slugs");
  const tc = useTranslations("common");
  const m = useMessage();
  const update = useUpdateAdminBlogSlug();

  const [phase, setPhase] = useState<"edit" | "confirm">("edit");
  const [value, setValue] = useState(row.slug);
  const [confirmValue, setConfirmValue] = useState("");
  const [error, setError] = useState<Message | string | null>(null);

  // Preview what the backend will actually store — it slugifies before saving,
  // so showing the raw input would promise a URL that never appears.
  const normalized = slugify(value);
  const unchanged = normalized === row.slug;

  return (
    <Dialog open onClose={onClose} title={t("edit.title")}>
      {phase === "edit" ? (
        <div className="flex flex-col gap-4">
          <Input
            label={t("edit.slugLabel")}
            value={value}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
          />
          <Typography variant="body-4" className="opacity-70">
            {t("edit.preview", { url: `/blogs/${normalized || "…"}` })}
          </Typography>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {tc("actions.cancel")}
            </Button>
            <Button
              disabled={!normalized || unchanged}
              onClick={() => {
                setError(null);
                setConfirmValue("");
                setPhase("confirm");
              }}
            >
              {tc("actions.continue")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Typography variant="body-3">
            {t.rich("edit.consequence", {
              old: `/blogs/${row.slug}`,
              next: `/blogs/${normalized}`,
              title: row.post.title,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </Typography>
          <Typography variant="body-4" className="text-warning">
            {t("edit.unknownTraffic")}
          </Typography>

          <Input
            label={t("edit.confirmLabel", { slug: row.slug })}
            value={confirmValue}
            autoFocus
            onChange={(event) => setConfirmValue(event.target.value)}
          />

          <FormError message={m(error)} />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPhase("edit")}>
              {tc("actions.back")}
            </Button>
            <Button
              className="bg-danger text-white hover:opacity-90"
              disabled={confirmValue.trim() !== row.slug || update.isPending}
              onClick={async () => {
                setError(null);
                try {
                  await update.mutateAsync({ id: row.id, slug: normalized });
                  onClose();
                } catch (cause) {
                  setError(blogErrorText(cause));
                  setPhase("edit");
                }
              }}
            >
              {update.isPending ? tc("states.saving") : t("edit.submit")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

/**
 * One step rather than two: deleting loses one URL, editing loses one AND adds a
 * junk one under a harmless-sounding label. Still a real confirm, though — the
 * delete is hard and there is no undo.
 */
function DeleteSlugDialog({
  row,
  onClose,
}: {
  row: BlogPostSlug;
  onClose: () => void;
}) {
  const t = useTranslations("admin.posts.slugs");
  const tc = useTranslations("common");
  const m = useMessage();
  const remove = useDeleteAdminBlogSlug();
  const [error, setError] = useState<Message | string | null>(null);

  return (
    <Dialog open onClose={onClose} title={t("delete.title")}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-3">
          {t("delete.body", { url: `/blogs/${row.slug}` })}
        </Typography>
        <Typography variant="body-4" className="opacity-70">
          {t("delete.postStaysReachable", { url: `/blogs/${row.post.slug}` })}
        </Typography>

        <FormError message={m(error)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            className="bg-danger text-white hover:opacity-90"
            disabled={remove.isPending}
            onClick={async () => {
              setError(null);
              try {
                await remove.mutateAsync(row.id);
                onClose();
              } catch (cause) {
                setError(blogErrorText(cause));
              }
            }}
          >
            {remove.isPending ? tc("states.deleting") : t("delete.submit")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: COLUMN_COUNT }).map((__, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
