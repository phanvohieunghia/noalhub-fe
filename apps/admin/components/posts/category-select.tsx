"use client";

import Link from "next/link";

import type { BlogCategory } from "@noalhub/api/blog";
import { useTranslations } from "next-intl";
import { Select } from "@noalhub/ui/select";
import { Typography } from "@noalhub/ui/typography";

/**
 * A category is a **single-value select with no free typing** (§7.1a).
 *
 * Free typing reopens exactly the door §2.6 closed: one mistyped `Hướng dẫn`
 * instead of picking the existing `Hướng dẫn` gives the site two categories with
 * the same name, two URLs, and both of them in the nav. Creating one happens in
 * `/posts/categories`.
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
   * A **published** post has no "— none —" option.
   *
   * The backend rejects that case with a 422 (a published post must have a
   * category), so leaving an empty option here only invites a click that then
   * errors — the exact "two round trips" §7.4 warns about. Drafts are the
   * opposite: empty is valid.
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
