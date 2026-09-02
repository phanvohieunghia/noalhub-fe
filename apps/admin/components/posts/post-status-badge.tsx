"use client";

import type { BlogPostStatus } from "@noalhub/api/blog";
import { Badge } from "@noalhub/ui/badge";
import { useTranslations } from "next-intl";

/**
 * `tone` is **semantic**, not a color — and the three states must look different
 * at a glance: `published` is what readers see right now, `archived` has been
 * taken off the public site (a soft delete, §2.2), `draft` is what nobody has
 * seen.
 */
const TONES = {
  draft: { tone: "neutral", key: "draft" },
  published: { tone: "success", key: "published" },
  archived: { tone: "warning", key: "archived" },
} as const;

export function PostStatusBadge({ status }: { status: BlogPostStatus }) {
  const t = useTranslations("admin.posts.status");
  const { tone, key } = TONES[status];
  return <Badge tone={tone}>{t(key)}</Badge>;
}
