type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Nhãn trạng thái nhỏ. `tone` là **ngữ nghĩa**, không phải màu — chỗ gọi nói
 * "cảnh báo", không nói "vàng", để sau này đổi bảng màu ở đúng một chỗ.
 *
 * Cố ý có `warning` tách khỏi `danger`: §3b của `docs/admin-plan.md` yêu cầu
 * phân biệt được khoá tạm (`suspended`) với khoá vĩnh viễn (`banned`); dùng
 * chung một sắc đỏ là mời gọi bấm sai.
 */
export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-black/8 text-foreground/70 dark:bg-white/12",
    success:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    danger: "bg-red-500/12 text-red-700 dark:text-red-300",
    info: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
