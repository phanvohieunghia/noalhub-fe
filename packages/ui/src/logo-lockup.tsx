import { LogoGlyphPaths } from "./logo";

/**
 * The lockup: the bare glyph (no tile) next to the "Noalhub" wordmark, for
 * headers and footers (Figma `Logo/Lockup`).
 *
 * Sized by font size, not by a width: the glyph is `1.95em` tall (Figma: a 117px
 * glyph beside 60px type), so `text-title-3` gives the 32px header lockup and the
 * whole thing scales with whatever text size the call site picks. Colors follow
 * the `--logo-*` tokens; add `dark` to force the on-dark variant (see `logo.tsx`).
 */
export function LogoLockup({ className = "text-title-3" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.27em] ${className}`}>
      <svg
        aria-hidden
        viewBox="0 0 380 366.86"
        className="h-[1.95em] shrink-0"
        style={
          {
            width: "calc(1.95em * 380 / 366.86)",
            "--logo-glyph-a": "var(--logo-a)",
            "--logo-glyph-b": "var(--logo-b)",
          } as React.CSSProperties
        }
      >
        <LogoGlyphPaths />
      </svg>
      <span className="font-bold tracking-tight text-(--logo-word)">
        Noal<span className="text-(--logo-word-accent)">hub</span>
      </span>
    </span>
  );
}
