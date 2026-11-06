/**
 * A photograph pulled into the brand's blue: grey first, then two flat layers on
 * top — a light blue multiplied in (whites become pale blue, blacks stay black)
 * and a deep blue lightened in (blacks lift to navy). The picture ends up
 * somewhere between the two, so photos from any source sit together on a page.
 *
 * The treatment is a CSS layer over the untouched file, so the original stays
 * usable and a different crop or source needs no re-export.
 *
 * ⚠️ The two layers use scale steps (`brand-300`, `brand-800`) on purpose, and
 * the look is the same in light and dark: a duotone is a fixed picture
 * treatment, not a themed surface — the one place besides charts where a RANGE
 * of the scale is wanted rather than a role (`docs/theme.md` §5.2).
 *
 * `overflow-hidden` + `isolate`: the corners clip the image, and the blend modes
 * stay inside this box instead of tinting whatever sits behind it.
 */
export function DuotoneImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  loading = 'lazy',
}: {
  src: string
  /** Empty for a decorative picture (the text next to it already says it). */
  alt: string
  /** Sizing and corners of the frame: `aspect-[16/9] rounded-2xl`. */
  className?: string
  imgClassName?: string
  loading?: 'lazy' | 'eager'
}) {
  return (
    <span
      className={`relative isolate block overflow-hidden bg-brand-800 ${className}`}>
      {/* A plain <img>, as in `Avatar`: sources can be any host, so no
          `remotePatterns` entry is needed per origin. */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`size-full object-cover grayscale contrast-110 ${imgClassName}`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-brand-300 mix-blend-multiply"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-brand-800 mix-blend-lighten"
      />
    </span>
  )
}
