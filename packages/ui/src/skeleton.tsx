/**
 * A placeholder block while loading. `aria-hidden` because its container
 * already carries `aria-busy`/`role="status"` — a screen reader has no use for
 * each individual gray box.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-md bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}
