"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { blogErrorText } from "@noalhub/core/blog/error-message";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { DEFAULT_LOCALE, isLocale } from "@noalhub/i18n/config";
import { intlLocale } from "@noalhub/i18n/formats";
import { useLocale, useTranslations } from "next-intl";
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
import { Typography } from "@noalhub/ui/typography";

/**
 * The field names the first token of an `ErrorResponseDto.details` sentence may
 * match.
 *
 * Only fields whose **wire name equals the form name** are listed. `categoryId`
 * and `tagIds` are deliberately absent: the form holds slugs
 * (`categorySlug`/`tagSlugs`), so `setError` would attach the error to a
 * nonexistent field and the form would jam silently. They fall through to the
 * banner — exactly the fallback `applyApiError` describes.
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
 * The post editor (`docs/blog.md` §7.1, §7.3).
 *
 * The save model is settled: one single copy of the content, **edited live**,
 * and **saved only on click**. No autosave, not even for drafts. The
 * consequences we accept, written down so nobody later mistakes them for bugs:
 *
 * - Editing a published post edits what the public is seeing right now.
 * - A power cut loses the work. In exchange: no half-finished version ever
 *   reaches the public on its own, and the backend needs a single content
 *   column.
 */
export function PostEditor({ postId }: { postId: string }) {
  const post = useAdminBlogPost(postId);
  const categories = useAdminBlogCategories();
  const tags = useAdminBlogTags();

  // All three queries must have finished and SUCCEEDED. Not just for type
  // narrowing: `toBlogPostPayload` converts category/tag slugs to ids using
  // those two lists, so opening the editor while they have failed invites a Save
  // that **strips every tag and the category from the post** without a word.
  const failed = [post, categories, tags].find((query) => query.isError);
  if (failed) {
    return (
      <main className="w-full p-6">
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

  // ⚠️ Wait for ALL THREE queries, not just the post. `toBlogPostPayload`
  // converts category/tag slugs to ids using these lists; calling it while they
  // are still empty silently strips every tag and the category on the very first
  // Save.
  if (!post.data || !categories.data || !tags.data) {
    return (
      <main className="flex w-full flex-col gap-4 p-6">
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

  const t = useTranslations("admin.posts");
  const tc = useTranslations("common");
  const m = useMessage();
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: toBlogPostFormValues(post),
  });
  const { register, handleSubmit, setError, setValue, reset, formState } = form;
  // `useWatch` rather than `watch()`: `watch()` returns a function the React
  // Compiler cannot safely memoize, so it bails out of optimizing the whole
  // component — and this is admin's heaviest component (editor plus preview at
  // once).
  //
  // The cast is safe here: `useWatch` without a `name` is typed `DeepPartial`
  // for the general case, but this form's `defaultValues` come from
  // `toBlogPostFormValues`, so EVERY field is present — none can be `undefined`
  // at runtime.
  const values = useWatch({ control: form.control }) as BlogPostFormValues;

  // The only safety net standing in for autosave (§7.3).
  useUnsavedChanges(formState.isDirty);

  // A new `version` arrives after every mutation; sync the form with what the
  // server returned so the next Save does not send a stale version and
  // manufacture a false 409.
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
        // Optimistic locking: the backend compares `version` and answers 409
        // `POST_CONFLICT` on a mismatch. Without it, two tabs belonging to the
        // same person — very common on a long post — silently overwrite each
        // other (§7.3).
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
    <main className="w-full p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Typography variant="h4" as="h1">
              {values.title.trim() || t("editor.untitled")}
            </Typography>
            <PostStatusBadge status={post.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SaveState isDirty={formState.isDirty} savedAt={savedAt} />
            <Button type="submit" disabled={busy || !formState.isDirty}>
              {update.isPending ? tc("states.saving") : tc("actions.save")}
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
                    setFormError(blogErrorText(error));
                  }
                }}
              >
                {t("editor.unpublish")}
              </Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={() => setPublishOpen(true)}>
                {t("editor.publish")}
              </Button>
            )}
          </div>
        </div>

        {/*
          A 409 is not "an error, try again": the server's copy has diverged, and
          overwriting it throws away someone else's work (or your own, in the
          other tab). So the UI offers exactly one way out — reload — and states
          its cost plainly (§7.3).
        */}
        {conflict ? (
          <div
            role="alert"
            className="text-body-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
          >
            <span>{t("editor.conflict")}</span>
            <Button variant="outline" onClick={async () => applyFresh(await onReloadPost())}>
              {t("editor.reload")}
            </Button>
          </div>
        ) : null}

        <FormError message={m(formError)} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Input
              label={t("editor.titleLabel")}
              {...register("title")}
              error={m(formState.errors.title?.message)}
            />

            <Textarea
              label={t("editor.excerptLabel")}
              rows={2}
              placeholder={t("editor.excerptPlaceholder")}
              {...register("excerpt")}
              error={m(formState.errors.excerpt?.message)}
            />

            {/*
              `setValue` with `shouldDirty` — otherwise leaving the page after an
              upload is NOT blocked by `useUnsavedChanges`, and the cover image
              just chosen is lost silently even though the file is already on the
              server.
            */}
            <CoverImageField
              value={values.coverImageUrl}
              error={m(formState.errors.coverImageUrl?.message)}
              onChange={(url) =>
                setValue("coverImageUrl", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            <div className="flex items-center gap-1 border-b border-black/10 dark:border-white/15">
              <TabButton active={tab === "edit"} onClick={() => setTab("edit")}>
                {t("editor.tabWrite")}
              </TabButton>
              <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
                {t("editor.tabPreview")}
              </TabButton>
            </div>

            {/*
              The preview uses the public site's EXACT renderer
              (`@noalhub/ui/blog/post-content`), not a reimplementation. That is
              why the renderer lives in `packages/ui` rather than `apps/web`: one
              code path means the preview can never drift from the real thing
              (§8).

              Both tabs stay mounted and are only shown or hidden: unmounting the
              Tiptap editor on every tab switch loses the undo history and the
              cursor position.
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
              onChange={(slug) => setValue("categorySlug", slug, { shouldDirty: true })}
              error={formState.errors.categorySlug?.message}
            />

            <TagMultiselect
              tags={tags}
              value={values.tagSlugs}
              onChange={(slugs) => setValue("tagSlugs", slugs, { shouldDirty: true })}
            />

            <SeoPanel form={form} publishedSlug={post.status === "published" ? post.slug : null} />

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
 * The cover image: once there is an image, show the image, not a URL field.
 *
 * The URL is an implementation detail — the author needs to know "what does the
 * cover look like", and the string `https://…/9f3c1e.webp` does not answer
 * that. The paste-a-URL field still exists but appears only while there is NO
 * image (the way in for externally hosted images); once there is one, replacing
 * and removing are two buttons.
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
  const t = useTranslations("admin.posts");
  const url = value.trim();

  return (
    <div className="flex flex-col gap-2">
      <Typography variant="title-4" as="span">
        {t("editor.coverLabel")}
      </Typography>

      {url ? (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-md border border-black/10 dark:border-white/15">
            {/*
              A plain `<img>` rather than `next/image`: the URL may have just been
              pasted by hand and not be in `remotePatterns` — through the
              optimizer that is a 400 in the middle of writing. See `OgPreview`
              in `seo-panel.tsx`.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={t("editor.coverAlt")}
              className="aspect-[16/9] w-full bg-black/5 object-cover dark:bg-white/5"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ImageUploadButton
              label={t("editor.changeCover")}
              onUploaded={(asset) => onChange(asset.url)}
            />
            <Button variant="outline" onClick={() => onChange("")}>
              {t("editor.removeCover")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ImageUploadButton
            label={t("editor.uploadCover")}
            onUploaded={(asset) => onChange(asset.url)}
          />
          <Input
            label={t("editor.coverUrlLabel")}
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
 * With no autosave, this indicator is the **only** thing telling the author
 * whether their work is safe (§7.3).
 */
function SaveState({ isDirty, savedAt }: { isDirty: boolean; savedAt: Date | null }) {
  const t = useTranslations("admin.posts");
  const locale = useLocale();
  /*
   * The last save time, in the locale being viewed. The formatter is built here
   * rather than at module scope: the locale is only known at runtime
   * (`docs/i18n.md` §7.1).
   */
  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(isLocale(locale) ? locale : DEFAULT_LOCALE), {
      hour: "2-digit",
      minute: "2-digit",
    }),
    [locale],
  );

  if (isDirty) {
    return (
      <Typography variant="body-3" as="span" className="text-amber-700 dark:text-amber-300">
        {t("editor.unsaved")}
      </Typography>
    );
  }
  if (savedAt) {
    return (
      <Typography variant="body-3" as="span" className="opacity-60">
        {t("editor.savedAt", { time: timeFormat.format(savedAt) })}
      </Typography>
    );
  }
  return (
    <Typography variant="body-3" as="span" className="opacity-60">
      {t("editor.noChanges")}
    </Typography>
  );
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
      className={`-mb-px border-b-2 px-3 py-2 text-body-3 transition-colors ${
        active ? "border-foreground font-medium" : "border-transparent opacity-60"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * A **soft** delete — the post moves to `archived` and the slug stays taken
 * (§2.2).
 *
 * A `draft` was never public, so "unpublish" is the wrong word for it: there
 * this reads as "discard draft". Same action, different wording.
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
  const t = useTranslations("admin.posts");
  const tc = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const isDraft = status === "draft";

  if (!confirming) {
    return (
      <Button variant="outline" disabled={disabled} onClick={() => setConfirming(true)}>
        {isDraft ? t("editor.archiveDraftTitle") : t("editor.archiveTitle")}
      </Button>
    );
  }

  return (
    <div className="text-body-3 flex flex-col gap-2 rounded-md border border-black/15 p-3 dark:border-white/20">
      <Typography variant="body-3" className="opacity-80">
        {isDraft
          ? t("editor.archiveDraftBody")
          : t("editor.archiveBody")}
      </Typography>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setConfirming(false)}>
          {tc("actions.cancel")}
        </Button>
        <Button disabled={disabled} onClick={() => void onArchive()}>
          {isDraft ? t("editor.archiveDraftAction") : t("editor.archiveAction")}
        </Button>
      </div>
    </div>
  );
}
