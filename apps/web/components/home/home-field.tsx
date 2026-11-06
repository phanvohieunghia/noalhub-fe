'use client'

import {useGSAP} from '@gsap/react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useRef} from 'react'

import {FieldBackdrop} from '@noalhub/ui/auth/field-backdrop'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * The coloured field behind the home page's panels (`Panel` on `bg-field`):
 *
 * 1. Living atmospheric aurora glows in brand cyan/teal tones that drift, swell,
 *    and breathe continuously across coprime durations (10s, 14s, 12s, 16s).
 * 2. An engraving of the British Museum reading-room dome laid over it in `--field-ink`,
 *    drifting smoothly in multi-axis motion and trailing scroll parallax.
 *
 * It is `fixed` and oversized, so the panels slide over it and it can move without
 * ever showing an edge.
 */
export function HomeField() {
  const domeRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!domeRef.current) return

    // Harmonic multi-axis floating drift for the dome engraving
    gsap.to(domeRef.current, {
      x: 64,
      y: 36,
      scale: 1.14,
      rotation: 1,
      duration: 10,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    // Parallax scroll: dome trails behind the panels as user scrolls
    gsap.fromTo(
      domeRef.current,
      {yPercent: -8},
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      },
    )
  })

  return <FieldBackdrop domeRef={domeRef} />
}
