"use client";

import type { UseFormReturn } from "react-hook-form";

import type { BlogPostFormValues } from "@noalhub/api/blog";
import { slugify } from "@noalhub/core/blog/slugify";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { appUrl, SEO_LIMITS, truncateForSeo } from "@noalhub/core/blog/seo";
import { Input } from "@noalhub/ui/input";
import { Textarea } from "@noalhub/ui/textarea";

import { ImageUploadButton } from "../media/image-upload-button";
import { Typography } from "@noalhub/ui/typography";

/**
 * The SEO panel — **show a preview, not just inputs** (`docs/blog.md` §7.2).
 *
 * Bare fields let nobody predict the outcome: an author types a 90-character
 * title without knowing Google shows about 60. The preview shares
 * `truncateForSeo` and `SEO_LIMITS` with the code that builds the real
 * metadata, so it cannot lie.
 *
 * The character count is a **soft warning**: it never blocks saving. Google
 * truncates by pixels rather than characters, so the number is an estimate —
 * hard-blocking on it would be wrong.
 */
export function SeoPanel({
  form,
  publishedSlug,
}: {
  form: UseFormReturn<BlogPostFormValues>;
  /** The slug currently live in public; `null` if the post has never been published. */
  publishedSlug: string | null;
}) {
  const t = useTranslations("admin.posts.seo");
  const m = useMessage();
  const { register, watch, setValue, formState } = form;
  const values = watch();

  const previewTitle = values.metaTitle.trim() || values.title.trim() || t("noTitle");
  const previewDescription =
    values.metaDescription.trim() || values.excerpt.trim() || t("noDescription");

  const slugChangedAfterPublish = publishedSlug !== null && values.slug.trim() !== publishedSlug;

  return (
    <aside className="flex flex-col gap-5">
      <Typography variant="title-4" as="h2" className="uppercase tracking-wide opacity-60">
        {t("heading")}
      </Typography>

      {/* The Google result preview */}
      <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
        <Typography variant="body-4" className="truncate opacity-60">
          {appUrl()}/blogs/{values.slug || "…"}
        </Typography>
        <Typography variant="body-2" className="mt-1 leading-snug text-blue-700 dark:text-blue-400">
          {truncateForSeo(previewTitle, SEO_LIMITS.title)}
        </Typography>
        <Typography variant="body-3" className="mt-1 leading-snug opacity-75">
          {truncateForSeo(previewDescription, SEO_LIMITS.description)}
        </Typography>
      </div>

      <div className="flex flex-col gap-1.5">
        <Input label={t("slugLabel")} {...register("slug")} error={m(formState.errors.slug?.message)} />
        <button
          type="button"
          className="w-fit text-body-4 underline underline-offset-2 opacity-70 hover:opacity-100"
          onClick={() =>
            setValue("slug", slugify(watch("title")), {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          {t("slugFromTitle")}
        </button>

        {/*
          Changing the slug of an ALREADY published post: warn right here, do not
          let it pass quietly like an ordinary field. Saying "301" is fair here
          because posts have the `blog_post_slugs` table to absorb it (§2.4) —
          quite unlike CATEGORY slugs, where the old URL dies outright (§2.6,
          §7.1a). Do not copy this wording over there.
        */}
        {slugChangedAfterPublish ? (
          <Typography
            variant="body-4"
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
          >
            {t.rich("slugChanged", {
              slug: publishedSlug ?? "",
              path: (chunks) => <strong>{chunks}</strong>,
            })}
          </Typography>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label={t("metaTitle")}
          placeholder={values.title || t("metaTitlePlaceholder")}
          {...register("metaTitle")}
          error={m(formState.errors.metaTitle?.message)}
        />
        <CharCount value={values.metaTitle || values.title} limit={SEO_LIMITS.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Textarea
          label={t("metaDescription")}
          rows={3}
          placeholder={t("metaDescriptionPlaceholder")}
          {...register("metaDescription")}
          error={m(formState.errors.metaDescription?.message)}
        />
        <CharCount
          value={values.metaDescription || values.excerpt}
          limit={SEO_LIMITS.description}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label={t("ogImage")}
          placeholder={t("ogImagePlaceholder")}
          {...register("ogImageUrl")}
          error={m(formState.errors.ogImageUrl?.message)}
        />
        <ImageUploadButton
          label={t("uploadOg")}
          onUploaded={(asset) =>
            setValue("ogImageUrl", asset.url, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        <OgPreview
          image={values.ogImageUrl || values.coverImageUrl}
          title={previewTitle}
          description={previewDescription}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label={t("canonical")}
          placeholder={t("canonicalPlaceholder")}
          {...register("canonicalUrl")}
          error={m(formState.errors.canonicalUrl?.message)}
        />
        <Typography variant="body-4" className="opacity-60">
          {t("canonicalHint")}
        </Typography>
      </div>

      <Typography variant="body-3" as="label" className="flex items-start gap-2">
        <input type="checkbox" {...register("noindex")} className="mt-1" />
        <span>
          <span className="font-medium">{t("noindex")}</span>
          <Typography variant="body-4" as="span" className="block opacity-60">
            {t("noindexHint")}
          </Typography>
        </span>
      </Typography>
    </aside>
  );
}

function CharCount({ value, limit }: { value: string; limit: number }) {
  const t = useTranslations("admin.posts.seo");
  const length = value.trim().length;
  const over = length > limit;

  return (
    <p
      className={`text-body-4 tabular-nums ${
        over ? "text-amber-700 dark:text-amber-300" : "opacity-60"
      }`}
    >
      {t(over ? "charCountOver" : "charCount", { length, limit })}
    </p>
  );
}

function OgPreview({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  const t = useTranslations("admin.posts.seo");

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
      {image ? (
        // A plain `<img>` rather than `next/image`: this previews a URL the user
        // just typed, which may not be in `remotePatterns` yet — sending it
        // through the optimizer means a 400 in the middle of editing.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="aspect-[1200/630] w-full object-cover" />
      ) : (
        <div className="text-body-4 flex aspect-[1200/630] w-full items-center justify-center bg-black/5 opacity-50 dark:bg-white/5">
          {t("ogEmpty")}
        </div>
      )}
      <div className="border-t border-black/10 p-2.5 dark:border-white/15">
        <Typography variant="title-4" className="truncate">
          {title}
        </Typography>
        <Typography variant="body-4" className="mt-0.5 line-clamp-2 opacity-70">
          {description}
        </Typography>
      </div>
    </div>
  );
}
