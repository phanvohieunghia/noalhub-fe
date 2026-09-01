"use client";

import Link from "next/link";

import type { BlogCategory } from "@noalhub/api/blog";
import { useTranslations } from "next-intl";
import { Select } from "@noalhub/ui/select";
import { Typography } from "@noalhub/ui/typography";

/**
 * Chuyên mục = **select một giá trị, không cho gõ tự do** (§7.1a).
 *
 * Cho gõ tự do là mở lại đúng cái cửa mà §2.6 vừa đóng: chỉ cần một lần gõ nhầm
 * `Hướng dẫn` thay vì chọn `Hướng dẫn` có sẵn là site có hai chuyên mục trùng
 * tên, hai URL, và nav hiện cả hai. Tạo mới phải sang `/posts/categories`.
 */
export function CategorySelect({
  categories,
  value,
  onChange,
  error,
  required = false,
}: {
  categories: BlogCategory[];
  value: string;
  onChange: (slug: string) => void;
  error?: string;
  /**
   * Bài **đang đăng** thì không có mục "— Chưa chọn —".
   *
   * Backend chặn ca đó bằng 422 (bài published bắt buộc có chuyên mục), nên để mục
   * rỗng ở đây chỉ là mời người dùng bấm rồi mới báo lỗi — đúng cái "bắt họ đi hai
   * vòng" mà §7.4 nói. Bản nháp thì ngược lại: để trống là hợp lệ.
   */
  required?: boolean;
}) {
  const t = useTranslations("admin.posts");

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        label={t("categorySelect.label")}
        placeholder={required ? undefined : t("categorySelect.unset")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        options={categories.map((category) => ({
          value: category.slug,
          label: category.name,
        }))}
      />
      {categories.length === 0 ? (
        <Typography variant="body-4" className="text-amber-700 dark:text-amber-300">
          {t("categorySelect.none")}{" "}
          <Link href="/posts/categories" className="underline underline-offset-2">
            {t("categorySelect.create")}
          </Link>
        </Typography>
      ) : (
        <Typography variant="body-4" className="opacity-60">
          {required ? t("categorySelect.requiredHint") : t("categorySelect.optionalHint")}{" "}
          <Link href="/posts/categories" className="underline underline-offset-2">
            {t("categorySelect.manage")}
          </Link>
        </Typography>
      )}
    </div>
  );
}
