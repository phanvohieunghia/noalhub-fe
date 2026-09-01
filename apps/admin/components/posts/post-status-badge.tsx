"use client";

import type { BlogPostStatus } from "@noalhub/api/blog";
import { Badge } from "@noalhub/ui/badge";
import { useTranslations } from "next-intl";

/**
 * `tone` là **ngữ nghĩa**, không phải màu — và ba trạng thái phải nhìn khác
 * nhau ngay từ xa: `published` là thứ độc giả đang thấy, `archived` là thứ đã
 * gỡ khỏi công khai (xoá mềm, §2.2), `draft` là chưa ai thấy.
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
