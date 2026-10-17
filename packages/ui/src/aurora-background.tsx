/**
 * A drifting teal "aurora" for brand surfaces — the auth screens' hero panel.
 *
 * Three blurred blobs from the `brand` scale on a deep `brand-950` base, with a
 * faint dot grid on top so the glow reads as texture rather than a flat
 * gradient. It is a fixed brand surface, not a themed one: it stays dark in both
 * light and dark mode, so text placed over it should use the light end of the
 * `brand` scale (`text-brand-50`), never `text-foreground`.
 *
 * Purely decorative (`aria-hidden`) and `pointer-events-none`. The drift runs
 * under `motion-safe:` only — with `prefers-reduced-motion` it is a still image.
 * Fill the nearest positioned ancestor; give that ancestor `overflow-hidden`.
 */
export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-brand-950 ${className}`}
    >
      <div className="absolute -left-1/4 -top-1/4 size-[70%] rounded-full bg-brand-500/60 blur-3xl motion-safe:animate-aurora-a" />
      <div className="absolute -bottom-1/4 -right-1/4 size-[75%] rounded-full bg-brand-400/40 blur-3xl motion-safe:animate-aurora-b" />
      <div className="absolute left-1/4 top-1/3 size-[45%] rounded-full bg-brand-700/70 blur-3xl motion-safe:animate-aurora-c" />
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-brand-300)_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.12]" />
    </div>
  );
}
