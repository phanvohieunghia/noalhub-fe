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
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/12 text-danger",
    info: "bg-highlight text-highlight-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-body-4 font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
