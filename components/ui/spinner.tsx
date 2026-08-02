const SIZES = { sm: "size-4", md: "size-5" } as const;

/**
 * Vòng xoay chờ. Mặc định `aria-hidden` — trạng thái tải phải được thông báo
 * bởi vùng chứa (`role="status"` + text), không phải bởi hình xoay.
 */
export function Spinner({
  size = "sm",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent opacity-60 ${SIZES[size]} ${className}`}
    />
  );
}
