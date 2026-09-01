"use client";

import { usePresence } from "@noalhub/api/chat";
import { lastSeenLabel } from "@noalhub/core/chat/format";
import { Typography } from "@noalhub/ui/typography";

/**
 * Đốm trạng thái. Ba trạng thái, không phải hai: presence chỉ được backend phát
 * cho người có chung hội thoại, nên "chưa có dữ liệu" là KHÔNG RÕ — không được
 * hiển thị thành offline chắc chắn.
 *
 * Màu một mình không truyền đạt thông tin → luôn kèm `title` + `sr-only`.
 */
export function PresenceDot({
  userId,
  className = "",
}: {
  userId: string | null | undefined;
  className?: string;
}) {
  const presence = usePresence(userId);

  const label = !presence
    ? "Không rõ trạng thái"
    : presence.status === "online"
      ? "Đang hoạt động"
      : (lastSeenLabel(presence.lastSeenAt) ?? "Không hoạt động");

  const color =
    presence?.status === "online"
      ? "bg-green-500"
      : presence
        ? "bg-black/25 dark:bg-white/30"
        : "bg-black/10 dark:bg-white/15";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span title={label} className={`size-2.5 rounded-full ring-2 ring-background ${color}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Text trạng thái cho `ChatHeader` — cùng nguồn dữ liệu với đốm màu. */
export function PresenceLabel({ userId }: { userId: string | null | undefined }) {
  const presence = usePresence(userId);
  if (!presence) return null;

  const label =
    presence.status === "online" ? "Đang hoạt động" : lastSeenLabel(presence.lastSeenAt);

  if (!label) return null;
  return (
    <Typography variant="body-4" as="span" className="opacity-60">
      {label}
    </Typography>
  );
}
