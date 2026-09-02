type Variant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "title-1"
  | "title-2"
  | "title-3"
  | "title-4"
  | "body-1"
  | "body-2"
  | "body-3"
  | "body-4"
  | "caption";

/**
 * Three weights only. Open Sans is a variable font so 300–800 technically
 * exist, but exposing all of them means everyone picks a different number and
 * the interface stops being consistent.
 */
type Weight = 400 | 500 | 600;

/**
 * ⚠️ This must be a lookup object with class names written out IN FULL.
 * Tailwind scans source with a regex rather than executing it, so
 * `text-${variant}` generates no class at all and everything loses its styling
 * in production (exactly the trap noted in `globals.css`).
 *
 * `caption` carries `italic` right here in the table: the slant is part of its
 * DEFINITION, not decoration applied at the call site.
 */
const VARIANTS: Record<Variant, string> = {
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  h5: "text-h5",
  h6: "text-h6",
  "title-1": "text-title-1",
  "title-2": "text-title-2",
  "title-3": "text-title-3",
  "title-4": "text-title-4",
  "body-1": "text-body-1",
  "body-2": "text-body-2",
  "body-3": "text-body-3",
  "body-4": "text-body-4",
  caption: "text-caption italic",
};

const WEIGHTS: Record<Weight, string> = {
  400: "font-normal",
  500: "font-medium",
  600: "font-semibold",
};

/**
 * Which weight each size defaults to.
 *
 * Headings are heavy (600); title 1–2 are still block headings so they stay at
 * 600, while title 3–4 have dropped to body size and come down to 500 — 600 at
 * 14px reads like shouting.
 */
const DEFAULT_WEIGHT: Record<Variant, Weight> = {
  h1: 600,
  h2: 600,
  h3: 600,
  h4: 600,
  h5: 600,
  h6: 600,
  "title-1": 600,
  "title-2": 600,
  "title-3": 500,
  "title-4": 500,
  "body-1": 400,
  "body-2": 400,
  "body-3": 400,
  "body-4": 400,
  caption: 400,
};

/** The default HTML tag. `title-*`/`caption` are `<p>` because they are NOT headings. */
const DEFAULT_TAG: Record<Variant, React.ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "title-1": "p",
  "title-2": "p",
  "title-3": "p",
  "title-4": "p",
  "body-1": "p",
  "body-2": "p",
  "body-3": "p",
  "body-4": "p",
  caption: "p",
};

type TypographyProps = {
  variant?: Variant;
  weight?: Weight;
  /**
   * The HTML tag, decoupled from `variant`.
   *
   * Heading level is **document structure**, type size is **visual** — mixing
   * the two is the fastest route to a page that jumps from `h1` to `h4`, or has
   * three `h1`s. For a level-2 heading that looks as small as an h4, write
   * `<Typography variant="h4" as="h2">` rather than changing the variant.
   *
   * For an image caption: `<Typography variant="caption" as="figcaption">`.
   */
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  /** For `as="label"` — `htmlFor` is not part of the generic `HTMLAttributes`. */
  htmlFor?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

export function Typography({
  variant = "body-2",
  weight,
  as,
  className = "",
  children,
  ...props
}: TypographyProps) {
  const Tag = as ?? DEFAULT_TAG[variant];
  const resolvedWeight = weight ?? DEFAULT_WEIGHT[variant];

  return (
    <Tag className={`${VARIANTS[variant]} ${WEIGHTS[resolvedWeight]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
