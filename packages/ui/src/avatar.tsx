const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
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
 * Ảnh + fallback chữ cái đầu.
 *
 * `aria-hidden` vì avatar luôn đi kèm tên ở dạng text ngay cạnh — đọc lại tên
 * hai lần là nhiễu cho screen reader.
 */
export function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const label = name?.trim() || "Người dùng";

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10 font-medium select-none dark:bg-white/15 ${SIZES[size]} ${className}`}
    >
      {src ? (
        // Avatar đến từ host bất kỳ (OAuth provider) → dùng <img> thường thay vì
        // next/image để không phải khai báo remotePatterns cho từng provider.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(label) || "?"
      )}
    </span>
  );
}
