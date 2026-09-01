"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  blogPostFormSchema,
  toBlogPostFormValues,
  toBlogPostPayload,
  useAdminBlogCategories,
  useAdminBlogPost,
  useAdminBlogTags,
  useArchiveBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
  useUpdateBlogPost,
  type BlogPost,
  type BlogPostFormValues,
} from "@noalhub/api/blog";
import { isPostConflict } from "@noalhub/api/errors";
import { blogErrorMessage } from "@noalhub/core/blog/error-message";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { TableOfContents } from "@noalhub/ui/blog/table-of-contents";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Textarea } from "@noalhub/ui/textarea";

import { AdminErrorState } from "../admin-error-state";
import { ImageUploadButton } from "../media/image-upload-button";
import { CategorySelect } from "./category-select";
import { PostStatusBadge } from "./post-status-badge";
import { PublishDialog } from "./publish-dialog";
import { SeoPanel } from "./seo-panel";
import { TagMultiselect } from "./tag-multiselect";
import { TiptapEditor } from "./tiptap-editor";
import { useUnsavedChanges } from "./use-unsaved-changes";

/**
 * Tên field mà token đầu câu trong `ErrorResponseDto.details` có thể khớp.
 *
 * Chỉ liệt kê field mà **tên trên dây trùng tên trong form**. `categoryId` và
 * `tagIds` cố ý vắng mặt: form giữ slug (`categorySlug`/`tagSlugs`) nên
 * `setError` sẽ gắn lỗi vào một field không tồn tại và form kẹt im lặng. Chúng
 * rơi lên banner — đó chính là hành vi dự phòng mà `applyApiError` mô tả.
 */
const KNOWN_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "coverImageUrl",
  "metaTitle",
  "metaDescription",
  "canonicalUrl",
  "ogImageUrl",
] as const;

/**
 * Editor bài viết (`docs/blog-plan.md` §7.1, §7.3).
 *
 * Mô hình lưu đã chốt: một bản nội dung duy nhất, **sửa thẳng bản live**, và
 * **chỉ lưu khi bấm nút**. Không autosave, kể cả với bài nháp. Hệ quả phải chấp
 * nhận, ghi ra để sau này không ai tưởng là bug:
 *
 * - Sửa bài đã publish là sửa thẳng cái đang hiển thị công khai.
 * - Mất điện là mất bài. Đổi lại: không có bản dở nào tự đẩy lên public, và
 *   backend chỉ cần một cột nội dung.
 */
export function PostEditor({ postId }: { postId: string }) {
  const post = useAdminBlogPost(postId);
  const categories = useAdminBlogCategories();
  const tags = useAdminBlogTags();

  // Cả ba query đều phải xong và đều phải THÀNH CÔNG. Không chỉ vì narrow kiểu:
  // `toBlogPostPayload` đổi slug chuyên mục/thẻ sang id bằng hai danh sách kia,
  // nên mở editor khi chúng lỗi là mời người dùng bấm Lưu và **gỡ sạch thẻ +
  // chuyên mục của bài** mà không báo gì.
  const failed = [post, categories, tags].find((query) => query.isError);
  if (failed) {
    return (
      <main className="w-full max-w-6xl p-6">
        <AdminErrorState
          error={failed.error}
          onRetry={() => {
            void post.refetch();
            void categories.refetch();
            void tags.refetch();
          }}
        />
      </main>
    );
  }

  // ⚠️ Chờ CẢ BA query, không chỉ query bài. `toBlogPostPayload` đổi slug chuyên
  // mục/thẻ sang id bằng hai danh sách này; gọi nó khi danh sách còn rỗng sẽ âm
  // thầm gỡ hết thẻ và chuyên mục của bài ngay lần Lưu đầu tiên.
  if (!post.data || !categories.data || !tags.data) {
    return (
      <main className="flex w-full max-w-6xl flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  return (
    <EditorForm
      key={post.data.id}
      post={post.data}
      categories={categories.data}
      tags={tags.data}
      onReloadPost={async () => {
        const fresh = await post.refetch();
        return fresh.data ?? post.data;
      }}
    />
  );
}

type EditorFormProps = {
  post: NonNullable<ReturnType<typeof useAdminBlogPost>["data"]>;
  categories: NonNullable<ReturnType<typeof useAdminBlogCategories>["data"]>;
  tags: NonNullable<ReturnType<typeof useAdminBlogTags>["data"]>;
  onReloadPost: () => Promise<EditorFormProps["post"]>;
};

function EditorForm({ post, categories, tags, onReloadPost }: EditorFormProps) {
  const router = useRouter();
  const update = useUpdateBlogPost(post.id);
  const publish = usePublishBlogPost(post.id);
  const unpublish = useUnpublishBlogPost(post.id);
  const archive = useArchiveBlogPost();

  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: toBlogPostFormValues(post),
  });
  const { register, handleSubmit, setError, setValue, reset, formState } = form;
  // `useWatch` chứ không `watch()`: `watch()` trả về một hàm mà React Compiler
  // không memo hoá an toàn được, nên nó bỏ tối ưu cả component — mà đây là
  // component nặng nhất của admin (editor + preview cùng lúc).
  //
  // Cast là an toàn ở đây: `useWatch` không có `name` khai kiểu `DeepPartial` cho
  // trường hợp chung, nhưng `defaultValues` của form này do
  // `toBlogPostFormValues` dựng nên MỌI field đều có mặt — không field nào có
  // thể là `undefined` lúc chạy.
  const values = useWatch({ control: form.control }) as BlogPostFormValues;

  // Lưới an toàn duy nhất thay cho autosave (§7.3).
  useUnsavedChanges(formState.isDirty);

  // `version` mới về sau mỗi mutation; đồng bộ form với bản server trả về để
  // lần Lưu kế tiếp không gửi version cũ và tự tạo ra 409 giả.
  useEffect(() => {
    reset(toBlogPostFormValues(post), { keepDefaultValues: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.version]);

  const applyFresh = (fresh: EditorFormProps["post"]) => {
    reset(toBlogPostFormValues(fresh));
    setSavedAt(new Date());
    setConflict(false);
  };

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      const saved = await update.mutateAsync({
        ...toBlogPostPayload(input, { categories, tags }),
        // Optimistic locking: backend so `version` và trả 409 `POST_CONFLICT`
        // nếu lệch. Không có nó thì hai tab của cùng một người — chuyện rất hay
        // xảy ra khi soạn bài dài — âm thầm ghi đè lẫn nhau (§7.3).
        version: post.version,
      });
      applyFresh(saved);
    } catch (error) {
      if (isPostConflict(error)) {
        setConflict(true);
        return;
      }
      setFormError(applyApiError(error, setError, KNOWN_FIELDS));
    }
  });

  const busy = update.isPending || publish.isPending || unpublish.isPending;

  return (
    <main className="w-full max-w-6xl p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">
              {values.title.trim() || "Bài viết không tên"}
            </h1>
            <PostStatusBadge status={post.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SaveState isDirty={formState.isDirty} savedAt={savedAt} />
            <Button type="submit" disabled={busy || !formState.isDirty}>
              {update.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
            {post.status === "published" ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setFormError(null);
                  try {
                    applyFresh(await unpublish.mutateAsync());
                  } catch (error) {
                    setFormError(blogErrorMessage(error));
                  }
                }}
              >
                Gỡ khỏi công khai
              </Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={() => setPublishOpen(true)}>
                Đăng bài
              </Button>
            )}
          </div>
        </div>

        {/*
          409 không phải "lỗi rồi thử lại": bản trên server đã khác, và ghi đè nó
          là mất công của người khác (hoặc của chính mình ở tab kia). Nên UI đưa
          đúng một lối ra — tải lại — và nói thẳng cái giá của nó (§7.3).
        */}
        {conflict ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
          >
            <span>
              Bản trên máy chủ đã thay đổi (có thể bạn đang mở bài này ở tab
              khác). Tải lại để lấy bản mới — thay đổi chưa lưu ở đây sẽ mất.
            </span>
            <Button
              variant="outline"
              onClick={async () => applyFresh(await onReloadPost())}
            >
              Tải lại bản trên máy chủ
            </Button>
          </div>
        ) : null}

        <FormError message={formError} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Input
              label="Tiêu đề"
              {...register("title")}
              error={formState.errors.title?.message}
            />

            <Textarea
              label="Tóm tắt"
              rows={2}
              placeholder="Bỏ trống thì backend tự sinh từ nội dung bài"
              {...register("excerpt")}
              error={formState.errors.excerpt?.message}
            />

            {/*
              `setValue` với `shouldDirty` — nếu không, upload xong rồi rời
              trang sẽ KHÔNG bị `useUnsavedChanges` chặn, và ảnh bìa vừa chọn
              mất im lặng dù file đã nằm trên máy chủ.
            */}
            <CoverImageField
              value={values.coverImageUrl}
              error={formState.errors.coverImageUrl?.message}
              onChange={(url) =>
                setValue("coverImageUrl", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            <div className="flex items-center gap-1 border-b border-black/10 dark:border-white/15">
              <TabButton active={tab === "edit"} onClick={() => setTab("edit")}>
                Soạn thảo
              </TabButton>
              <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
                Xem trước
              </TabButton>
            </div>

            {/*
              Preview dùng ĐÚNG renderer của trang công khai
              (`@noalhub/ui/blog/post-content`), không phải một bản dựng lại. Đó
              là lý do renderer nằm ở `packages/ui` chứ không ở `apps/web`: một
              code path thì preview không bao giờ lệch với bản thật (§8).

              Cả hai tab đều được mount, chỉ ẩn/hiện: unmount editor Tiptap mỗi
              lần đổi tab là mất undo history và mất vị trí con trỏ.
            */}
            <div className={tab === "edit" ? undefined : "hidden"}>
              <TiptapEditor
                value={values.content}
                onChange={(doc) =>
                  setValue("content", doc, { shouldDirty: true, shouldValidate: true })
                }
              />
            </div>

            {tab === "preview" ? (
              <div className="flex flex-col gap-6 rounded-md border border-black/10 p-6 dark:border-white/15">
                <TableOfContents doc={values.content} />
                <PostContent doc={values.content} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-5">
            <CategorySelect
              categories={categories}
              required={post.status === "published"}
              value={values.categorySlug}
              onChange={(slug) =>
                setValue("categorySlug", slug, { shouldDirty: true })
              }
              error={formState.errors.categorySlug?.message}
            />

            <TagMultiselect
              tags={tags}
              value={values.tagSlugs}
              onChange={(slugs) => setValue("tagSlugs", slugs, { shouldDirty: true })}
            />

            <SeoPanel
              form={form}
              publishedSlug={post.status === "published" ? post.slug : null}
            />

            {post.status === "archived" ? null : (
              <ArchiveButton
                status={post.status}
                disabled={busy || archive.isPending}
                onArchive={async () => {
                  await archive.mutateAsync(post.id);
                  router.push("/posts");
                }}
              />
            )}
          </div>
        </div>
      </form>

      {publishOpen ? (
        <PublishDialog
          values={values}
          hasUnsavedChanges={formState.isDirty}
          isPending={publish.isPending}
          onConfirm={async () => applyFresh(await publish.mutateAsync())}
          onClose={() => setPublishOpen(false)}
        />
      ) : null}
    </main>
  );
}

/**
 * Ảnh bìa: khi đã có ảnh thì hiện chính tấm ảnh, không phải một ô URL.
 *
 * URL chỉ là chi tiết cài đặt — người viết cần biết "ảnh bìa trông thế nào",
 * và một chuỗi `https://…/9f3c1e.webp` không trả lời được câu đó. Ô dán URL vẫn
 * còn nhưng chỉ xuất hiện khi CHƯA có ảnh (lối vào cho ảnh từ nguồn ngoài);
 * có ảnh rồi thì đổi/xoá là hai nút.
 */
function CoverImageField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (url: string) => void;
}) {
  const url = value.trim();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Ảnh bìa</span>

      {url ? (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-md border border-black/10 dark:border-white/15">
            {/*
              `<img>` thuần chứ không `next/image`: URL có thể vừa được dán tay
              và chưa nằm trong `remotePatterns` — qua optimizer là 400 ngay
              giữa lúc soạn bài. Xem `OgPreview` trong `seo-panel.tsx`.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Ảnh bìa của bài viết"
              className="aspect-[16/9] w-full bg-black/5 object-cover dark:bg-white/5"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImageUploadButton label="Đổi ảnh bìa" onUploaded={(asset) => onChange(asset.url)} />
            <Button variant="outline" onClick={() => onChange("")}>
              Xoá ảnh bìa
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ImageUploadButton label="Tải ảnh bìa lên" onUploaded={(asset) => onChange(asset.url)} />
          <Input
            label="Hoặc dán URL ảnh"
            placeholder="https://images.unsplash.com/…"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )}

      <FormError message={error} />
    </div>
  );
}

/**
 * Vì không autosave nên chỉ báo này là thứ **duy nhất** người viết dựa vào để
 * biết công của mình đã an toàn hay chưa (§7.3).
 */
function SaveState({ isDirty, savedAt }: { isDirty: boolean; savedAt: Date | null }) {
  if (isDirty) {
    return (
      <span className="text-sm text-amber-700 dark:text-amber-300">
        Có thay đổi chưa lưu
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-sm opacity-60">
        Đã lưu {savedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }
  return <span className="text-sm opacity-60">Chưa có thay đổi</span>;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
        active ? "border-foreground font-medium" : "border-transparent opacity-60"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Xoá **mềm** — bài chuyển sang `archived`, slug vẫn bị chiếm (§2.2).
 *
 * Bài `draft` chưa từng lên công khai nên "gỡ" là sai ngữ cảnh: với nó đây là
 * "bỏ bài nháp". Cùng một hành động, khác chữ.
 */
function ArchiveButton({
  status,
  disabled,
  onArchive,
}: {
  status: BlogPost["status"];
  disabled: boolean;
  onArchive: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const isDraft = status === "draft";

  if (!confirming) {
    return (
      <Button variant="outline" disabled={disabled} onClick={() => setConfirming(true)}>
        {isDraft ? "Bỏ bài nháp này" : "Gỡ bài này"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-black/15 p-3 text-sm dark:border-white/20">
      <p className="opacity-80">
        {isDraft
          ? "Bài nháp chuyển sang trạng thái “Đã gỡ” và không còn trong danh sách đang soạn. Nội dung vẫn còn và slug vẫn bị giữ — không có xoá vĩnh viễn."
          : "Bài sẽ chuyển sang trạng thái “Đã gỡ” và biến mất khỏi trang công khai. Nội dung vẫn còn và slug vẫn bị giữ — không có xoá vĩnh viễn."}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setConfirming(false)}>
          Huỷ
        </Button>
        <Button disabled={disabled} onClick={() => void onArchive()}>
          {isDraft ? "Bỏ bài nháp" : "Gỡ bài"}
        </Button>
      </div>
    </div>
  );
}
