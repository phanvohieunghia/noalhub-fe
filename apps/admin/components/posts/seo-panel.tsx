"use client";

import type { UseFormReturn } from "react-hook-form";

import type { BlogPostFormValues } from "@noalhub/api/blog";
import { slugify } from "@noalhub/core/blog/slugify";
import { appUrl, SEO_LIMITS, truncateForSeo } from "@noalhub/core/blog/seo";
import { Input } from "@noalhub/ui/input";
import { Textarea } from "@noalhub/ui/textarea";

import { ImageUploadButton } from "../media/image-upload-button";
import { Typography } from "@noalhub/ui/typography";

/**
 * Panel SEO — **hiện preview, đừng chỉ hiện input** (`docs/blog-plan.md` §7.2).
 *
 * Ô nhập trơn thì không ai đoán được kết quả: người viết gõ 90 ký tự tiêu đề mà
 * không biết Google chỉ hiện ~60. Preview dùng chung `truncateForSeo` +
 * `SEO_LIMITS` với chỗ dựng metadata thật, nên nó không nói dối.
 *
 * Đếm ký tự là **cảnh báo mềm**: không chặn lưu. Google cắt theo pixel chứ không
 * theo ký tự nên con số chỉ là ước lượng — chặn cứng theo nó là sai.
 */
export function SeoPanel({
  form,
  publishedSlug,
}: {
  form: UseFormReturn<BlogPostFormValues>;
  /** Slug đang chạy công khai; `null` nếu bài chưa từng publish. */
  publishedSlug: string | null;
}) {
  const { register, watch, setValue, formState } = form;
  const values = watch();

  const previewTitle = values.metaTitle.trim() || values.title.trim() || "Chưa có tiêu đề";
  const previewDescription =
    values.metaDescription.trim() ||
    values.excerpt.trim() ||
    "Chưa có mô tả — Google sẽ tự cắt một đoạn trong bài, thường không hay bằng.";

  const slugChangedAfterPublish = publishedSlug !== null && values.slug.trim() !== publishedSlug;

  return (
    <aside className="flex flex-col gap-5">
      <Typography variant="title-4" as="h2" className="uppercase tracking-wide opacity-60">
        SEO
      </Typography>

      {/* Preview kết quả Google */}
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
        <Input label="Slug" {...register("slug")} error={formState.errors.slug?.message} />
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
          Sinh slug từ tiêu đề
        </button>

        {/*
          Bài ĐÃ publish mà đổi slug: phải cảnh báo ngay tại chỗ, đừng để nó lặng
          lẽ như một field bình thường. Ở đây được nói "301" vì bài có bảng
          `blog_post_slugs` đỡ đòn (§2.4) — khác hẳn slug CHUYÊN MỤC, nơi URL cũ
          chết hẳn (§2.6, §7.1a). Đừng chép câu này sang đó.
        */}
        {slugChangedAfterPublish ? (
          <Typography
            variant="body-4"
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
          >
            Bài này đang chạy ở <strong>/blogs/{publishedSlug}</strong>. Đổi slug thì URL cũ sẽ được
            chuyển hướng 301 sang slug mới — link cũ vẫn dùng được, nhưng nên có lý do để đổi.
          </Typography>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Meta title"
          placeholder={values.title || "Bỏ trống sẽ dùng tiêu đề bài"}
          {...register("metaTitle")}
          error={formState.errors.metaTitle?.message}
        />
        <CharCount value={values.metaTitle || values.title} limit={SEO_LIMITS.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Textarea
          label="Meta description"
          rows={3}
          placeholder="Bỏ trống sẽ dùng tóm tắt bài"
          {...register("metaDescription")}
          error={formState.errors.metaDescription?.message}
        />
        <CharCount
          value={values.metaDescription || values.excerpt}
          limit={SEO_LIMITS.description}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Ảnh OG"
          placeholder="Bỏ trống sẽ dùng ảnh bìa"
          {...register("ogImageUrl")}
          error={formState.errors.ogImageUrl?.message}
        />
        <ImageUploadButton
          label="Tải ảnh OG lên"
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
          label="Canonical URL"
          placeholder="Chỉ điền khi bài này đăng lại từ nguồn khác"
          {...register("canonicalUrl")}
          error={formState.errors.canonicalUrl?.message}
        />
        <Typography variant="body-4" className="opacity-60">
          Bỏ trống là đúng trong hầu hết trường hợp — canonical mặc định trỏ về chính bài này.
        </Typography>
      </div>

      <Typography variant="body-3" as="label" className="flex items-start gap-2">
        <input type="checkbox" {...register("noindex")} className="mt-1" />
        <span>
          <span className="font-medium">Không cho Google index bài này</span>
          <Typography variant="body-4" as="span" className="block opacity-60">
            Bài vẫn công khai và vẫn có trong sitemap — chỉ là bảo công cụ tìm kiếm bỏ qua.
          </Typography>
        </span>
      </Typography>
    </aside>
  );
}

function CharCount({ value, limit }: { value: string; limit: number }) {
  const length = value.trim().length;
  const over = length > limit;

  return (
    <p
      className={`text-body-4 tabular-nums ${
        over ? "text-amber-700 dark:text-amber-300" : "opacity-60"
      }`}
    >
      {length}/{limit} ký tự{over ? " — Google nhiều khả năng sẽ cắt bớt" : ""}
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
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
      {image ? (
        // `<img>` thuần chứ không `next/image`: đây là preview của một URL người
        // dùng vừa gõ, có thể chưa nằm trong `remotePatterns` — cho nó đi qua
        // optimizer là nhận 400 ngay trong lúc soạn.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="aspect-[1200/630] w-full object-cover" />
      ) : (
        <div className="text-body-4 flex aspect-[1200/630] w-full items-center justify-center bg-black/5 opacity-50 dark:bg-white/5">
          Chưa có ảnh — thẻ chia sẻ sẽ chỉ có chữ
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
