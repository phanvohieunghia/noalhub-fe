"use client";

import { useTranslations } from "next-intl";
import { Typography } from "@noalhub/ui/typography";

/**
 * The unread-count pill. A bare number tells a screen reader nothing → it is
 * paired with a full `sr-only` description.
 */
export function UnreadBadge({ count }: { count: number }) {
  const t = useTranslations("web.chat.sidebar");

  if (count <= 0) return null;

  return (
    <Typography
      as="span"
      variant="body-4"
      weight={600}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-background"
    >
      <span aria-hidden>{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{t("unread", { count })}</span>
    </Typography>
  );
}
