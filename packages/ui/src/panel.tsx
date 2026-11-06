import {keysOf} from './variants'

/**
 * `tone` is a role, not a colour: the panel's ground and the ink on it travel
 * together so a call site cannot pair a dark ground with dark text.
 */
const TONES = {
  surface: 'bg-surface text-surface-foreground',
  muted: 'bg-muted text-foreground',
  primary: 'bg-primary text-primary-foreground',
} as const

/** Corner size is decided once per surface, not per call site. */
const RADII = {
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
} as const

const PADDINGS = {
  none: '',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-10',
} as const

const ELEMENTS = ['div', 'section', 'article', 'aside'] as const

export type PanelTone = keyof typeof TONES
export type PanelRadius = keyof typeof RADII
export type PanelPadding = keyof typeof PADDINGS
export type PanelElement = (typeof ELEMENTS)[number]

/** Derived from the tables above — see `variants.ts`. */
export const PANEL_TONES = keysOf(TONES)
export const PANEL_RADII = keysOf(RADII)
export const PANEL_PADDINGS = keysOf(PADDINGS)
export const PANEL_ELEMENTS = ELEMENTS

/**
 * A large rounded surface that holds a whole block of a public page (a blog
 * listing, an article, a mission statement). It stands out from the page by a
 * step in tone, never by a border or a shadow, so it reads best on a `primary`
 * or `muted` field behind it:
 *
 *   <div className="bg-primary p-4 md:p-10">
 *     <Panel as="section">…</Panel>
 *   </div>
 *
 * `overflow-hidden` is on purpose: a picture or sketch placed with
 * `padding="none"` runs to the panel's edge and follows its corners.
 * Reference: `docs/ui-reference-gas-for-africa.md`.
 */
export function Panel({
  as: Element = 'div',
  tone = 'surface',
  radius = 'xl',
  padding = 'lg',
  className = '',
  children,
}: {
  as?: PanelElement
  tone?: PanelTone
  radius?: PanelRadius
  padding?: PanelPadding
  className?: string
  children: React.ReactNode
}) {
  return (
    <Element
      className={`overflow-hidden ${TONES[tone]} ${RADII[radius]} ${PADDINGS[padding]} ${className}`}>
      {children}
    </Element>
  )
}
