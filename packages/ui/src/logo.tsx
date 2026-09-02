/**
 * The Noalhub mark, shared by `apps/web` and `apps/admin`.
 *
 * Inline SVG rather than an `<img src="/logo.svg">`: `apps/admin` has no
 * `public/` directory, and a component can be imported by both apps from
 * `packages/ui` without either of them shipping its own copy of the asset. It
 * also renders in the first HTML, so the mark never flashes in after paint.
 *
 * The colors come from the theme tokens (`bg-primary` / `text-primary-foreground`
 * behaviour, expressed as `currentColor` and a token `fill`), so the mark stays
 * legible in dark mode — the brand teal of the source file (`brand-700`) is
 * nearly invisible on a dark background. The standalone `app/icon.svg` in each
 * app keeps the fixed brand color instead, because a favicon has no access to
 * the page's CSS variables.
 *
 * `aria-hidden` by default: the mark almost always sits next to the wordmark as
 * text, and reading the name twice is noise for a screen reader. Pass a `title`
 * where it stands alone.
 */
export function Logo({
  className = "size-8",
  title,
}: {
  className?: string;
  /** Accessible name. Only pass it when the mark stands without a wordmark. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`shrink-0 text-primary ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        fill="currentColor"
        d="M96 0H24C10.7452 0 0 10.7452 0 24V96C0 109.255 10.7452 120 24 120H96C109.255 120 120 109.255 120 96V24C120 10.7452 109.255 0 96 0Z"
      />
      <path fill="var(--primary-foreground)" d="M32 88V32H48L88 76V32V88H72L32 44V88Z" />
    </svg>
  );
}
