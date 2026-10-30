'use client'

import {type SVGProps, useEffect, useMemo, useRef, useState} from 'react'
import {ICON_COLLECTIONS} from './icon-data.generated'
import {
  Morpher,
  resolveSpring,
  type SpringConfig,
  type SpringPreset,
} from './morph/driver'
import {
  type IconNode,
  iconNodeToD,
  type Shape,
  subsToD,
  svgBodyToD,
  toShape,
} from './morph/geometry'
import {createPlan} from './morph/plan'

/**
 * What a MorphIcon accepts: an Iconify name ("lucide:menu"), raw path data, or a
 * Lucide-style IconNode. Stroke icons only; fills are ignored.
 */
export type MorphIconData = string | IconNode

export type {IconNode, SpringConfig, SpringPreset}

const ICONIFY_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/
const shapeCache = new Map<string, Shape>()

/** Looks an Iconify name up in the bundled offline collections. */
function iconifyBody(name: string): string {
  const [prefix, key] = name.split(':') as [string, string]
  const collection = ICON_COLLECTIONS.find((c) => c.prefix === prefix)
  const entry =
    collection?.icons[key] ??
    collection?.icons[collection.aliases?.[key]?.parent ?? '']
  return entry?.body ?? ''
}

function resolveD(icon: MorphIconData): string {
  if (typeof icon !== 'string') return iconNodeToD(icon)
  if (ICONIFY_NAME.test(icon)) return svgBodyToD(iconifyBody(icon))
  return icon
}

/** True when `icon` resolves to stroke geometry MorphIcon can animate (brand icons registered via addIcon cannot). */
export function canMorph(icon: unknown): icon is string {
  return typeof icon === 'string' && resolveD(icon) !== ''
}

/** Parsed shapes are cached by their path data; resampling is the expensive step. */
function resolveShape(icon: MorphIconData): Shape {
  const d = resolveD(icon)
  let shape = shapeCache.get(d)
  if (!shape) {
    shape = toShape(d)
    shapeCache.set(d, shape)
  }
  return shape
}

export interface MorphIconProps extends Omit<
  SVGProps<SVGSVGElement>,
  'ref' | 'children' | 'from' | 'to'
> {
  /** Change this and the icon morphs to the new one. */
  icon?: MorphIconData
  /** Controlled mode: with `from`, `to` and `progress` set, you drive the morph yourself. */
  from?: MorphIconData
  to?: MorphIconData
  /** 0 = `from`, 1 = `to`. May go outside [0, 1]. */
  progress?: number
  size?: number | string
  strokeWidth?: number
  /** A preset, or `{ stiffness, damping }`. */
  spring?: SpringPreset | SpringConfig
  /** "user" follows prefers-reduced-motion; "never" (default) always animates. */
  reducedMotion?: 'never' | 'user' | 'always'
  /** Accessible name. Without it the icon is aria-hidden. */
  label?: string
}

export function MorphIcon({
  icon,
  from,
  to,
  progress = 0,
  size = 24,
  strokeWidth = 2,
  spring = 'snappy',
  reducedMotion = 'never',
  label,
  ...svgProps
}: MorphIconProps) {
  const controlled = from !== undefined && to !== undefined
  const current = controlled ? from : icon
  const pathRef = useRef<SVGPathElement>(null)
  const morpher = useRef<Morpher | null>(null)
  // React only ever renders this initial `d`; every later write goes straight to the DOM,
  // so re-renders can never fight the animation.
  const [initialD] = useState(() =>
    current === undefined ? '' : resolveShape(current).d,
  )

  const springConfig = resolveSpring(spring)
  const springRef = useRef(springConfig)
  springRef.current = springConfig

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const m = new Morpher(
      (d) => path.setAttribute('d', d),
      current === undefined ? {d: '', subs: []} : resolveShape(current),
    )
    morpher.current = m
    return () => {
      m.destroy()
      morpher.current = null
    }
    // The morpher lives for the lifetime of the element; icon changes go through the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Uncontrolled: animate whenever `icon` changes.
  useEffect(() => {
    if (controlled || icon === undefined || !morpher.current) return
    const shape = resolveShape(icon)
    const skip =
      reducedMotion === 'always' ||
      (reducedMotion === 'user' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (skip) morpher.current.set(shape)
    else morpher.current.morphTo(shape, springRef.current)
  }, [icon, controlled, reducedMotion])

  // Controlled: render the blend at `progress`.
  const plan = useMemo(
    () =>
      controlled ? createPlan(resolveShape(from), resolveShape(to)) : null,
    [controlled, from, to],
  )
  useEffect(() => {
    if (!plan) return
    morpher.current?.destroy()
    pathRef.current?.setAttribute('d', subsToD(plan.at(progress)))
  }, [plan, progress])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...svgProps}>
      <path ref={pathRef} d={initialD} />
    </svg>
  )
}
