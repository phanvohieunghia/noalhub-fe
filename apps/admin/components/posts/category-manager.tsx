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
import { blogErrorMessage } from "@noalhub/core/blog/error-message";
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
 * Quản lý chuyên mục (`docs/blog-plan.md` §7.1a).
 *
 * Tách khỏi `/posts` vì nó thao tác trên tập khác, và **phải làm trước editor**:
 * không có chuyên mục thì ô select ở editor rỗng và không publish nổi bài nào
 * (§11 bước 4).
 */
export function CategoryManager() {
  const categories = useAdminBlogCategories();
  const reorder = useReorderBlogCategories();
  const [editing, setEditing] = useState<BlogCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<BlogCategory | null>(null);

  // `distance: 4` để một cú click vào nút Sửa/Xoá không bị nuốt thành drag.
  // `sortableKeyboardCoordinates` là cách kéo bằng bàn phím: Space nhấc hàng,
  // mũi tên di chuyển, Space thả — không có nó thì tính năng này chỉ dùng được
  // bằng chuột.
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
    // Backend đòi ĐỦ id (gán `order` = vị trí trong mảng) nên gửi cả danh sách,
    // không riêng hai hàng vừa đổi chỗ.
    reorder.mutate(next.map((row) => row.id));
  };

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="h4" as="h1">
            Chuyên mục
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            Mỗi bài thuộc đúng một chuyên mục, và bắt buộc có chuyên mục mới đăng được. Chuyên mục
            hiện trên thanh menu của trang blog công khai — kéo hàng để đổi thứ tự hiện ở đó.
          </Typography>
        </div>
        <Button onClick={() => setEditing("new")}>Thêm chuyên mục</Button>
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
            // Hàng bảng chỉ đổi chỗ theo chiều dọc và không được ra khỏi
            // `<tbody>` — thả nó lơ lửng giữa trang là vô nghĩa.
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={onDragEnd}
          >
            <TableRoot caption="Danh sách chuyên mục">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>
                    <span className="sr-only">Kéo để sắp xếp</span>
                  </TableHeaderCell>
                  <TableHeaderCell>Tên</TableHeaderCell>
                  <TableHeaderCell>Slug</TableHeaderCell>
                  <TableHeaderCell>Thứ tự</TableHeaderCell>
                  <TableHeaderCell>Số bài</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Hành động</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.isPending ? (
                  <SkeletonRows />
                ) : rows.length === 0 ? (
                  <TableEmptyRow colSpan={6}>
                    Chưa có chuyên mục nào. Tạo ít nhất một cái trước khi viết bài.
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
              {blogErrorMessage(reorder.error)} Thứ tự đã được trả về như cũ.
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
  const create = useCreateBlogCategory();
  const update = useUpdateBlogCategory();
  const [formError, setFormError] = useState<string | null>(null);

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

  // `useWatch` chứ không `watch()`: `watch()` trả về một hàm mà React Compiler
  // không memo hoá an toàn được, nên nó bỏ tối ưu cả component.
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
    <Dialog open onClose={onClose} title={category ? "Sửa chuyên mục" : "Thêm chuyên mục"}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Tên" {...register("name")} error={errors.name?.message} />

        <div className="flex flex-col gap-1.5">
          <Input label="Slug" {...register("slug")} error={errors.slug?.message} />
          <button
            type="button"
            className="w-fit text-body-4 underline underline-offset-2 opacity-70 hover:opacity-100"
            onClick={() =>
              // `getValues` chứ không `useWatch`: đọc một lần lúc bấm, không
              // cần component render lại theo ô Tên.
              setValue("slug", slugify(getValues("name")), { shouldValidate: true })
            }
          >
            Sinh slug từ tên
          </button>
        </div>

        {/*
          ⚠️ Cảnh báo NẶNG HƠN một bậc so với đổi slug bài. Bài có bảng
          `blog_post_slugs` đỡ đòn nên URL cũ được 301 sang slug mới (§2.4);
          chuyên mục KHÔNG có bảng đó (§2.6), nên URL cũ chết hẳn. Câu chữ ở đây
          phải nói đúng điều đó, không được viết thành "sẽ được chuyển hướng".
        */}
        {slugChanged ? (
          <Typography
            variant="body-3"
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
          >
            Đổi slug sẽ làm <strong>/blogs/category/{category?.slug}</strong> trả 404 vĩnh viễn.
            Không có chuyển hướng nào được tạo — mọi link cũ tới trang chuyên mục này sẽ hỏng.
          </Typography>
        ) : null}

        <Textarea
          label="Mô tả"
          rows={3}
          {...register("description")}
          error={errors.description?.message}
        />
        <Typography variant="body-4" className="-mt-2 opacity-60">
          Hiện ở đầu trang chuyên mục. Đây là thứ làm trang đó không bị Google coi là nội dung mỏng
          — nên viết một câu thật.
        </Typography>

        <Input
          label="Thứ tự trên menu"
          type="number"
          min={0}
          {...register("order", { valueAsNumber: true })}
          error={errors.order?.message}
        />

        <FormError message={formError} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * Xoá **chỉ khi rỗng**. Backend trả 409 `CATEGORY_NOT_EMPTY` kèm số bài, và câu
 * đó được hiện nguyên trong dialog thay vì một toast lỗi trơ (§7.1a) — người
 * dùng cần biết còn bao nhiêu bài phải dời đi, không phải biết rằng "có lỗi".
 */
function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: BlogCategory;
  onClose: () => void;
}) {
  const remove = useDeleteBlogCategory();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onClose={onClose} title={`Xoá chuyên mục “${category.name}”?`}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-3" className="opacity-80">
          Chỉ xoá được chuyên mục không còn bài nào. Bài không có chuyên mục thì không đăng được,
          nên hãy dời bài sang mục khác trước.
        </Typography>

        <FormError message={error} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={async () => {
              setError(null);
              try {
                await remove.mutateAsync(category.id);
                onClose();
              } catch (cause) {
                setError(blogErrorMessage(cause));
              }
            }}
          >
            {remove.isPending ? "Đang xoá…" : "Xoá"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Một hàng kéo được.
 *
 * Dùng `<tr>` trần thay vì `TableRow` của `@noalhub/ui` vì dnd-kit cần `ref` +
 * `style` transform trực tiếp trên node, còn `TableRow` không nhận ref.
 * Kéo chỉ bằng **handle** chứ không bằng cả hàng: cả hàng kéo được thì không
 * bôi đen được tên/slug để copy.
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
          aria-label={`Kéo để sắp xếp ${category.name}`}
          className="cursor-grab rounded px-1 text-body-2 leading-none opacity-40 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none active:cursor-grabbing dark:focus-visible:ring-white/40"
        >
          ⠿
        </button>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="opacity-70">/{category.slug}</TableCell>
      <TableCell className="tabular-nums">{category.order}</TableCell>
      {/* Con số này đếm CẢ bài nháp — khác `postCount` ở trang công khai, vốn
          chỉ đếm bài đã đăng (§2.2). */}
      <TableCell className="tabular-nums">{category.postCount}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onEdit}>
            Sửa
          </Button>
          <Button variant="outline" onClick={onDelete}>
            Xoá
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
