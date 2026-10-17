/**
 * The Noalhub brand art, shared by `apps/web` and `apps/admin` (Figma
 * "Branding" section: `Logo/Mark` and `Logo/Lockup`).
 *
 * Inline SVG rather than an `<img src="/logo.svg">`: `apps/admin` has no
 * `public/` directory, and a component can be imported by both apps from
 * `packages/ui` without either of them shipping its own copy of the asset. It
 * also renders in the first HTML, so the mark never flashes in after paint.
 *
 * The colors come from the `--logo-*` tokens in `theme.css`, so the art follows
 * light/dark on its own. Put `dark` on the element (or an ancestor) to force the
 * on-dark variant on a surface that is dark in both modes. The standalone
 * `app/icon.svg` in each app keeps fixed colors instead, because a favicon has
 * no access to the page's CSS variables.
 *
 * `aria-hidden` by default: the mark almost always sits next to the wordmark as
 * text, and reading the name twice is noise for a screen reader. Pass a `title`
 * where it stands alone.
 */

/** The glyph's six shapes in a 380 × 366.86 box: three `a` (teal), three `b` (deep/mint). */
export function LogoGlyphPaths() {
  return (
    <>
      <path fill="var(--logo-glyph-a)" d="M88.0996 0L185.4 97.31V152.53L88.0996 56.54V0Z" />
      <path
        fill="var(--logo-glyph-a)"
        d="M89.41 95.99L117.02 123.6L56.54 185.4L138.06 268.24L176.19 230.11V286.65L138.06 323.46L0 185.4L89.41 95.99Z"
      />
      <path
        fill="var(--logo-glyph-a)"
        d="M239.31 132.81L286.64 177.51L239.31 226.16L211.7 198.55L231.42 178.83L211.7 157.79L239.31 132.81Z"
      />
      <path
        fill="var(--logo-glyph-b)"
        d="M243.25 39.45L380 177.51L289.27 269.55L262.98 243.26L323.46 177.51L243.25 95.99L203.81 134.12V78.9L243.25 39.45Z"
      />
      <path fill="var(--logo-glyph-b)" d="M193.29 211.7L289.27 309V366.86L193.29 269.55V211.7Z" />
      <path
        fill="var(--logo-glyph-b)"
        d="M140.69 139.38L168.3 165.68L151.21 185.4L168.3 203.81L140.69 231.42L94.6699 185.4L140.69 139.38Z"
      />
    </>
  );
}

/** The mark: the glyph on a rounded tile (the app icon). */
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
      className={`shrink-0 ${className}`}
      style={
        {
          "--logo-glyph-a": "var(--logo-tile-a)",
          "--logo-glyph-b": "var(--logo-tile-b)",
        } as React.CSSProperties
      }
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="120" height="120" rx="28" fill="var(--logo-tile)" />
      {/* Glyph box from Figma: inset 18.33% sides / 19.43% top, i.e. 76 wide at (22, 23.32). */}
      <g transform="translate(22 23.32) scale(0.2)">
        <LogoGlyphPaths />
      </g>
    </svg>
  );
}
