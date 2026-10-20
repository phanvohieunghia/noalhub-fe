"use client";

import { useLocale, useTranslations } from "next-intl";

import { useQaItemTags } from "@noalhub/api/qa";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Skeleton } from "@noalhub/ui/skeleton";
import { pickTagLabel } from "@noalhub/ui/tag-mark";
import { Typography } from "@noalhub/ui/typography";

/**
 * Which tags a question carries. Only the ids are saved (`qa_items.tag_ids`); where and
 * how a tag is drawn is the tag's own business (`meta`), so nothing here touches the
 * question text.
 *
 * A switched-off tag is still listed while the question carries it: hiding it would make
 * the box vanish from under a question that has it, and saving would silently drop it.
 * It is disabled for NEW attachment, and ticking it off here is the way to remove it.
 */
export function QaItemTagPicker({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const t = useTranslations("admin.qa");
  const locale = useLocale();
  const tags = useQaItemTags();

  const visible = (tags.data ?? []).filter((tag) => tag.active || value.includes(tag.id));
  if (!tags.isPending && visible.length === 0) return null;

  return (
    <fieldset className="flex flex-col gap-2">
      <Typography variant="title-4" as="legend">
        {t("items.tagsLabel")}
      </Typography>
      <Typography variant="body-4" className="text-muted-foreground">
        {t("items.tagsHint")}
      </Typography>
      {tags.isPending ? (
        <Skeleton className="h-5 w-48" />
      ) : (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {visible.map((tag) => {
            const label = pickTagLabel(tag.meta.label, locale, tag.key);
            const checked = value.includes(tag.id);
            return (
              <Checkbox
                key={tag.id}
                size="sm"
                label={tag.active ? label : `${label} (${t("tags.disabled")})`}
                checked={checked}
                disabled={!tag.active && !checked}
                onCheckedChange={(on) =>
                  onChange(on === true ? [...value, tag.id] : value.filter((id) => id !== tag.id))
                }
              />
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
