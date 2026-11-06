'use client'

import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useGSAP} from '@gsap/react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useRef} from 'react'

import {Button} from '@noalhub/ui/button'
import {Icon} from '@noalhub/ui/icons'
import {Typography} from '@noalhub/ui/typography'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export type HomeHeroCopy = {
  line1: string
  line2: string
  lead: string
  cta: string
  cards?: {
    reality: {
      title: string
      points: string[]
    }
    solution: {
      title: string
      points: string[]
    }
    statement: {
      text: string
    }
  }
}

/**
 * Where each bird flies: `top` is a share of the drawing's height (the sky above the
 * roofs; negative reaches above the drawing), `size` its width in px, `duration` the seconds to cross, and `phase`
 * where in that crossing it already is when the page opens, so they never leave
 * the left edge in a row.
 */
const BIRDS = [
  {top: 6, size: 26, duration: 46, phase: 0.1},
  {top: 16, size: 18, duration: 62, phase: 0.45},
  {top: 26, size: 30, duration: 54, phase: 0.7},
  {top: 10, size: 16, duration: 70, phase: 0.85},
  {top: 32, size: 22, duration: 58, phase: 0.3},
  // Above the drawing's own box: only in view on a screen tall enough to leave sky.
  {top: -22, size: 20, duration: 66, phase: 0.55},
  {top: -42, size: 24, duration: 50, phase: 0.2},
] as const

/**
 * The home hero. Text arrives as props from the server page: the client bundle of
 * `/` carries only the shared namespaces, not `web.home`.
 *
 * The background is a panoramic lithograph of a harbour town, drawn in ink on a
 * transparent ground and wiped in from left to right through a soft-edged CSS mask
 * (`docs/gsap_sketch_reveal_guide.md`, method A): GSAP animates `--reveal` from
 * before the first pixel to past the last, so the page opens with nothing and the
 * drawing arrives. Once it is in, a second layer keeps the scene alive: birds
 * cross the sky behind the roofs, the whole scene sways a little, and it drifts at
 * its own pace as the page scrolls.
 *
 * The start state is CSS (`.hero-reveal`, `.hero-sketch`, `.hero-bird`), so nothing
 * flashes before the timeline runs; with no script the page just shows the
 * finished state. With reduced motion the same entrance plays without any travel,
 * and the ambient layer shrinks to the birds gliding very slowly: no flapping,
 * no sway, no scroll parallax.
 */
export function HomeHero({copy}: {copy: HomeHeroCopy}) {
  const root = useRef<HTMLElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const drawing = useRef<HTMLDivElement>(null)
  const sketch = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const motion = gsap.matchMedia()

      // The entrance, twice: with travel (heading, lead and action rise in, cards
      // float up) or, for reduced motion, as plain fades with a quicker wipe.
      // Returns the timeline so the ambient layer can start when it ends.
      const enter = (travel: boolean) => {
        const rise = travel ? {y: 0} : {}
        const tl = gsap.timeline({defaults: {ease: 'power3.out'}})
        tl.to('[data-hero="intro"]', {
          opacity: 1,
          ...rise,
          duration: travel ? 0.8 : 0.6,
          stagger: 0.12,
        }).fromTo(
          sketch.current,
          {'--reveal': '-15%'},
          {
            '--reveal': '100%',
            duration: travel ? 2.4 : 1.8,
            ease: 'power2.inOut',
          },
          '-=0.5',
        )
        return tl
      }

      // Birds cross the scene left to right and wrap. Each starts part-way along
      // its crossing (`phase`) so the sky is populated at once. A flap only when
      // motion is welcome.
      const fly = (speed: number, flap: boolean) => {
        const box = drawing.current
        if (!box) return
        const birds = gsap.utils.toArray<HTMLElement>('[data-hero="bird"]', box)
        birds.forEach((bird, i) => {
          const {duration, phase} = BIRDS[i]
          // Measured once: a refresh (ScrollTrigger runs one after load) must not
          // rewind the tween, or every bird would be back at the left edge.
          const end = box.clientWidth + 40
          gsap
            .fromTo(
              bird,
              {x: -40},
              {x: end, duration: duration * speed, ease: 'none', repeat: -1},
            )
            // Already part-way across when the page opens.
            .progress(phase)
          if (flap) {
            gsap.to(bird.querySelector('svg'), {
              scaleY: 0.4,
              transformOrigin: '50% 100%',
              duration: 0.45 + (i % 3) * 0.08,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            })
            gsap.to(bird, {
              y: i % 2 ? 7 : -7,
              duration: 3.2 + i * 0.6,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            })
          }
        })
        // Fade the birds in once the drawing is nearly done.
        gsap.to(birds, {opacity: 1, duration: 1.6, delay: 2.2, stagger: 0.2})
      }

      motion.add('(prefers-reduced-motion: no-preference)', () => {
        enter(true)
        fly(1, true)
        // The scene sways by a few pixels, slowly, as if the air moved.
        gsap.to(scene.current, {
          x: 12,
          duration: 9,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 3,
        })
        // …and trails the page as it scrolls: the drawing moves slower than the
        // words in front of it, which is what makes it feel behind them.
        gsap.to(scene.current, {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        })
      })

      motion.add('(prefers-reduced-motion: reduce)', () => {
        enter(false)
        fly(2.5, false)
      })
    },
    {scope: root},
  )

  return (
    <section
      ref={root}
      className="relative isolate flex flex-1 flex-col justify-between overflow-hidden px-4 pt-6 pb-0 md:px-8 md:pt-10 md:pb-0 lg:px-12">
      {/* Ambient morning mist radial glow behind headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 h-[340px] w-[680px] rounded-full bg-[radial-gradient(ellipse_at_center,var(--primary)/0.06_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,var(--primary)/0.12_0%,transparent_70%)]"
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 text-center max-md:my-auto md:gap-5">
        <Typography
          variant="h1"
          as="h1"
          data-hero="intro"
          className="hero-reveal font-serif text-[clamp(2.5rem,5.5svh,3.5rem)] leading-[1.08] font-normal tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[clamp(3.25rem,7svh,4.5rem)]">
          {copy.line1} <br className="hidden md:block" />
          {copy.line2}
        </Typography>
        <Typography
          variant="body-1"
          data-hero="intro"
          className="hero-reveal max-w-xl text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
          {copy.lead}
        </Typography>
        <div data-hero="intro" className="hero-reveal pt-2">
          <Button
            asChild
            variant="outline"
            size="md"
            className="rounded-full backdrop-blur-md bg-surface/50 border border-border/80 shadow-xs hover:bg-surface/85 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all text-foreground h-11 px-7">
            <Link href={routes.blog} className="flex items-center gap-2">
              {copy.cta}
              <Icon icon="lucide:arrow-right" className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* The panoramic harbour skyline emerging through atmospheric mist */}
      <div
        ref={scene}
        aria-hidden
        className="pointer-events-none relative -mx-4 mt-auto min-h-[340px] flex-none overflow-hidden md:-mx-8 md:min-h-[240px] md:flex-1 lg:-mx-12">
        <div
          ref={drawing}
          className="absolute inset-x-0 bottom-0 mx-auto aspect-[1840/440] w-[340%] -translate-x-[39%] md:w-full md:translate-x-0">
          <div ref={sketch} className="hero-sketch absolute inset-0" />
          {BIRDS.map((bird, i) => (
            <span
              key={i}
              data-hero="bird"
              className="hero-bird absolute left-0 text-accent"
              style={{top: `${bird.top}%`, width: bird.size}}>
              <svg viewBox="0 0 24 10" fill="none" className="block w-full">
                <path
                  d="M0 8 Q6 -1 12 7 Q18 -1 24 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ))}
        </div>
        {/* Soft water mist fade overlay over the bottom of the sketch */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
      </div>
    </section>
  )
}
