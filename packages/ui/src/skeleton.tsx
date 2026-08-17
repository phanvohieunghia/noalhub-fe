/**
 * Khối placeholder lúc đang tải. `aria-hidden` vì vùng chứa nó đã có
 * `aria-busy`/`role="status"` — screen reader không cần biết về từng khối xám.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-md bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}
