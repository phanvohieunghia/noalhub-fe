"use client";

import { Avatar as RadixAvatar } from "radix-ui";

const SIZES = {
  sm: "size-8 text-body-4",
  md: "size-10 text-body-3",
  lg: "size-12 text-body-2",
} as const;

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Chữ cái đầu của tối đa hai từ đầu tiên: "Nguyễn An" → "NA". */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Ảnh + fallback chữ cái đầu, dựng trên Radix Avatar: Radix theo dõi trạng
 * thái tải của ảnh nên ảnh hỏng / chậm sẽ rơi về chữ cái đầu thay vì để lại ô
 * vỡ — thứ mà `<img>` trần không tự làm được.
 *
 * `aria-hidden` vì avatar luôn đi kèm tên ở dạng text ngay cạnh — đọc lại tên
 * hai lần là nhiễu cho screen reader.
 */
export function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const label = name?.trim() || "Người dùng";

  return (
    <RadixAvatar.Root
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10 font-medium select-none dark:bg-white/15 ${SIZES[size]} ${className}`}
    >
      {src ? (
        // Avatar đến từ host bất kỳ (OAuth provider) → Radix render <img> thường
        // thay vì next/image, khỏi phải khai remotePatterns cho từng provider.
        <RadixAvatar.Image src={src} alt="" className="size-full object-cover" />
      ) : null}
      {/* delayMs=0: fallback hiện ngay, không nháy ô trống chờ ảnh. */}
      <RadixAvatar.Fallback delayMs={0}>{initials(label) || "?"}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
