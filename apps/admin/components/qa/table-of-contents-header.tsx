"use client";

import { useTranslations } from "next-intl";
import { forwardRef, type ChangeEvent } from "react";

import { Badge } from "@noalhub/ui/badge";
import { ICONS } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Typography } from "@noalhub/ui/typography";

/** Title, version badge and the ⌘K search field of the table of contents. */
export const TableOfContentsHeader = forwardRef<
  HTMLInputElement,
  {
    version: number;
    /** This is the dataset's current outline version: the badge turns green. */
    isCurrent?: boolean;
    query: string;
    onQueryChange: (query: string) => void;
  }
>(function TableOfContentsHeader({ version, isCurrent = false, query, onQueryChange }, searchRef) {
  const t = useTranslations("admin.qa");

  return (
    <div className="flex flex-col gap-3 pb-2.5">
      <div className="flex items-center justify-between gap-2">
        <Typography variant="title-4" as="h2" className="uppercase tracking-[0.2em]">
          {t("outlines.sectionsTitle")}
        </Typography>
        <Badge tone={isCurrent ? "success" : "neutral"}>{t("outlines.versionShort", { version })}</Badge>
      </div>

      <Input
        ref={searchRef}
        size="sm"
        hideLabel
        label={t("outlines.searchLabel")}
        placeholder={t("outlines.searchPlaceholder")}
        leadingIcon={ICONS.search}
        value={query}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
      />
    </div>
  );
});
