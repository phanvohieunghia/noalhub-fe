"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  blogCategoryFormSchema,
  useAdminBlogCategories,
  useCreateBlogCategory,
  useDeleteBlogCategory,
  useReorderBlogCategories,
  useUpdateBlogCategory,
  type BlogCategory,
  type BlogCategoryFormValues,
} from "@noalhub/api/blog";
import { blogErrorText } from "@noalhub/core/blog/error-message";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { slugify } from "@noalhub/core/blog/slugify";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
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
import { Textarea } from "@noalhub/ui/textarea";

import { AdminErrorState } from "../admin-error-state";
import { Typography } from "@noalhub/ui/typography";

const FIELDS = ["name", "slug", "description", "order"] as const;

/**
 * Category management (`docs/blog.md` §7.1a).
 *
 * Separate from `/posts` because it operates on a different set, and it **has to
 * come before the editor**: with no categories the editor's select is empty and
 * nothing can be published (§11, step 4).
 */
export function CategoryManager() {
  const t = useTranslations("admin.posts.categories");
  const m = useMessage();

  const categories = useAdminBlogCategories();
  const reorder = useReorderBlogCategories();
  const [editing, setEditing] = useState<BlogCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<BlogCategory | null>(null);

  // `distance: 4` so a click on Edit/Delete is not swallowed as a drag.
  // `sortableKeyboardCoordinates` is the keyboard drag: Space lifts the row,
  // arrows move it, Space drops it — without it the feature is mouse-only.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const rows = categories.data ?? [];

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = rows.findIndex((row) => row.id === active.id);
    const to = rows.findIndex((row) => row.id === over.id);
    if (from === -1 || to === -1) return;

    const next = [...rows];
    next.splice(to, 0, ...next.splice(from, 1));
    // The backend requires EVERY id (it assigns `order` from the array
    // position), so send the whole list, not just the two swapped rows.
    reorder.mutate(next.map((row) => row.id));
  };

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="h4" as="h1">
            {t("title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("intro")}
          </Typography>
        </div>
        <Button onClick={() => setEditing("new")}>{t("add")}</Button>
      </div>

      {categories.isError ? (
        <div className="mt-4">
          <AdminErrorState error={categories.error} onRetry={() => categories.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            // Table rows only move vertically and must not leave `<tbody>` —
            // dropping one loose in the middle of the page is meaningless.
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={onDragEnd}
          >
            <TableRoot caption={t("caption")}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>
                    <span className="sr-only">{t("dragColumn")}</span>
                  </TableHeaderCell>
                  <TableHeaderCell>{t("columns.name")}</TableHeaderCell>
                  <TableHeaderCell>{t("columns.slug")}</TableHeaderCell>
                  <TableHeaderCell>{t("columns.order")}</TableHeaderCell>
                  <TableHeaderCell>{t("columns.postCount")}</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">{t("actionsColumn")}</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.isPending ? (
                  <SkeletonRows />
                ) : rows.length === 0 ? (
                  <TableEmptyRow colSpan={6}>
                    {t("empty")}
                  </TableEmptyRow>
                ) : (
                  <SortableContext
                    items={rows.map((row) => row.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        onEdit={() => setEditing(category)}
                        onDelete={() => setDeleting(category)}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            </TableRoot>
          </DndContext>

          {reorder.isError ? (
            <Typography variant="body-3" className="mt-2 text-red-600 dark:text-red-400">
              {t("reorderFailed", { message: m(blogErrorText(reorder.error)) ?? "" })}
            </Typography>
          ) : null}
        </div>
      )}

      {editing ? (
        <CategoryDialog
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <DeleteCategoryDialog category={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </main>
  );
}

function CategoryDialog({
  category,
  onClose,
}: {
  category: BlogCategory | null;
  onClose: () => void;
}) {
  const t = useTranslations("admin.posts.categories");
  const tc = useTranslations("common");
  const m = useMessage();
  const create = useCreateBlogCategory();
  const update = useUpdateBlogCategory();
  const [formError, setFormError] = useState<Message | string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      order: category?.order ?? 0,
    },
  });

  // `useWatch` rather than `watch()`: `watch()` returns a function the React
  // Compiler cannot safely memoize, so it bails out of optimizing the whole
  // component.
  const slug = useWatch({ control, name: "slug" });
  const slugChanged = Boolean(category) && slug !== category?.slug;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, input: values });
      } else {
        await create.mutateAsync(values);
      }
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, setError, FIELDS));
    }
  });

  return (
    <Dialog open onClose={onClose} title={category ? t("edit") : t("add")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label={t("nameLabel")} {...register("name")} error={m(errors.name?.message)} />

        <div className="flex flex-col gap-1.5">
          <Input label={t("columns.slug")} {...register("slug")} error={m(errors.slug?.message)} />
          <button
            type="button"
            className="w-fit text-body-4 underline underline-offset-2 opacity-70 hover:opacity-100"
            onClick={() =>
              // `getValues` rather than `useWatch`: read once on click; the
              // component need not re-render as the Name field changes.
              setValue("slug", slugify(getValues("name")), { shouldValidate: true })
            }
          >
            {t("slugFromName")}
          </button>
        </div>

        {/*
          ⚠️ A warning ONE STEP heavier than the one for post slugs. Posts have
          the `blog_post_slugs` table to absorb the change, so old URLs 301 to
          the new slug (§2.4); categories have NO such table (§2.6), so the old
          URL dies outright. The wording here has to say that, and must never be
          softened into "will be redirected".
        */}
        {slugChanged ? (
          <Typography
            variant="body-3"
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
          >
            {t.rich("slugWarning", {
              slug: category?.slug ?? "",
              path: (chunks) => <strong>{chunks}</strong>,
            })}
          </Typography>
        ) : null}

        <Textarea
          label={t("descriptionLabel")}
          rows={3}
          {...register("description")}
          error={m(errors.description?.message)}
        />
        <Typography variant="body-4" className="-mt-2 opacity-60">
          {t("descriptionHint")}
        </Typography>

        <Input
          label={t("orderLabel")}
          type="number"
          min={0}
          {...register("order", { valueAsNumber: true })}
          error={m(errors.order?.message)}
        />

        <FormError message={m(formError)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tc("states.saving") : tc("actions.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * Deletion **only when empty**. The backend answers 409 `CATEGORY_NOT_EMPTY`
 * with the post count, and that sentence is shown verbatim in the dialog rather
 * than as a bare error toast (§7.1a) — the user needs to know how many posts
 * they must move, not merely that "something went wrong".
 */
function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: BlogCategory;
  onClose: () => void;
}) {
  const t = useTranslations("admin.posts.categories");
  const tc = useTranslations("common");
  const m = useMessage();
  const remove = useDeleteBlogCategory();
  const [error, setError] = useState<Message | string | null>(null);

  return (
    <Dialog open onClose={onClose} title={t("deleteTitle", { name: category.name })}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-3" className="opacity-80">
          {t("deleteBody")}
        </Typography>

        <FormError message={m(error)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={async () => {
              setError(null);
              try {
                await remove.mutateAsync(category.id);
                onClose();
              } catch (cause) {
                setError(blogErrorText(cause));
              }
            }}
          >
            {remove.isPending ? tc("states.deleting") : tc("actions.delete")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * One draggable row.
 *
 * A bare `<tr>` instead of `@noalhub/ui`'s `TableRow`, because dnd-kit needs a
 * `ref` and a `style` transform directly on the node, and `TableRow` takes no
 * ref. Dragging happens by **handle** only, never the whole row: a
 * fully-draggable row cannot be selected to copy the name or slug.
 */
function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: BlogCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("admin.posts.categories");
  const tc = useTranslations("common");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`transition-colors hover:bg-black/3 dark:hover:bg-white/5 ${
        isDragging ? "relative z-10 bg-black/5 shadow-sm dark:bg-white/10" : ""
      }`}
    >
      <TableCell className="w-8">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("dragRow", { name: category.name })}
          className="cursor-grab rounded px-1 text-body-2 leading-none opacity-40 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none active:cursor-grabbing dark:focus-visible:ring-white/40"
        >
          ⠿
        </button>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="opacity-70">/{category.slug}</TableCell>
      <TableCell className="tabular-nums">{category.order}</TableCell>
      {/* This number counts drafts TOO — unlike the public `postCount`, which
          counts published posts only (§2.2). */}
      <TableCell className="tabular-nums">{category.postCount}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onEdit}>
            {tc("actions.edit")}
          </Button>
          <Button variant="outline" onClick={onDelete}>
            {tc("actions.delete")}
          </Button>
        </div>
      </TableCell>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} aria-busy="true">
          {Array.from({ length: 6 }).map((__, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full max-w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
