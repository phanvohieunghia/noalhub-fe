const SIZES = { sm: "size-4", md: "size-5" } as const;

/**
 * A loading spinner. `aria-hidden` by default — the loading state must be
 * announced by the container (`role="status"` plus text), not by the animation.
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
