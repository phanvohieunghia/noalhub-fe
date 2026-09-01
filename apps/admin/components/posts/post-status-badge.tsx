import type { BlogPostStatus } from "@noalhub/api/blog";
import { Badge } from "@noalhub/ui/badge";

/**
 * `tone` là **ngữ nghĩa**, không phải màu — và ba trạng thái phải nhìn khác
 * nhau ngay từ xa: `published` là thứ độc giả đang thấy, `archived` là thứ đã
 * gỡ khỏi công khai (xoá mềm, §2.2), `draft` là chưa ai thấy.
 */
const TONES = {
  draft: { tone: "neutral", label: "Nháp" },
  published: { tone: "success", label: "Đã đăng" },
  archived: { tone: "warning", label: "Đã gỡ" },
} as const;

export function PostStatusBadge({ status }: { status: BlogPostStatus }) {
  const { tone, label } = TONES[status];
  return <Badge tone={tone}>{label}</Badge>;
}
