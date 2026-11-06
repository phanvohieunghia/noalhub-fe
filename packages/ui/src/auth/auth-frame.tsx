import {Panel} from '../panel'
import {Typography} from '../typography'

/**
 * The frame shared by every sign-in / sign-up / reset screen: the coloured field
 * with one large `Panel` on it, split from `lg` up. Markup only — the app's
 * `AuthShell` adds the GSAP entrance (it finds the parts by their `data-auth`
 * attributes) and passes the real field, logo link and switches.
 *
 * The drawing takes the height the brand side's text leaves and is never behind
 * it: it is white ink at 40% opacity, and text over it measures 2.5:1 in light
 * mode (axe fails it). For the same reason the copyright line lives on the form
 * side.
 *
 * The brand side is the louder half: the tagline set large in the serif, the
 * three things Noalhub does, and the skyline drawing behind them. The form side
 * stays quiet: a serif heading, then the fields. Below `lg` the brand side drops
 * away and the form takes the panel.
 */
export function AuthFrame({
  rootRef,
  className = 'min-h-dvh',
  field,
  logo,
  tools,
  tagline,
  features,
  copyright,
  children,
}: {
  rootRef?: React.Ref<HTMLDivElement>
  className?: string
  /** The `FieldBackdrop`. */
  field: React.ReactNode
  /** The brand mark, already a link in the app. */
  logo: React.ReactNode
  /** Theme and language switches, top right of the form side. */
  tools: React.ReactNode
  /** Split after the first clause so the two halves can rise one by one. */
  tagline: string
  features: string[]
  copyright: string
  children: React.ReactNode
}) {
  const [first, ...rest] = tagline.split(/(?<=[—–,.])\s+/)

  return (
    <div
      ref={rootRef}
      className={`bg-field text-foreground relative isolate flex flex-1 flex-col ${className}`}>
      {field}
      <div className="flex flex-1 flex-col p-3 md:p-8">
        <Panel
          as="div"
          padding="none"
          className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex flex-col gap-10 p-6 md:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-3">
              {logo}
              <div className="flex items-center gap-2">{tools}</div>
            </div>

            <main
              data-auth="form"
              className="flex flex-1 items-center justify-center md:[&_h1]:text-5xl [&_h1]:font-serif [&_h1]:text-4xl [&_h1]:leading-tight [&_h1]:font-normal [&_h1]:tracking-tight">
              <div className="w-full max-w-sm">{children}</div>
            </main>

            <Typography variant="body-4" className="text-muted-foreground">
              {copyright}
            </Typography>
          </div>

          <aside className="bg-primary text-primary-foreground relative hidden flex-col overflow-hidden p-12 lg:flex xl:p-16">
            <div className="relative z-10 flex flex-col gap-12">
              <p className="font-serif text-5xl leading-[1.08] font-normal tracking-tight text-balance xl:text-6xl">
                <span className="block overflow-hidden">
                  <span data-auth="line" className="block">
                    {first}
                  </span>
                </span>
                {rest.length > 0 && (
                  <span className="block overflow-hidden">
                    <span data-auth="line" className="block">
                      {rest.join(' ')}
                    </span>
                  </span>
                )}
              </p>
              <ul className="max-w-md space-y-3">
                {features.map((feature) => (
                  <li key={feature} data-auth="feature">
                    <Typography as="span" variant="body-2">
                      {feature}
                    </Typography>
                  </li>
                ))}
              </ul>
            </div>

            {/* In the flow, taking whatever height the text leaves — never behind it. */}
            <div
              aria-hidden
              data-auth="sketch"
              className="auth-sketch pointer-events-none -mx-12 -mb-12 mt-12 min-h-40 flex-1 xl:-mx-16 xl:-mb-16"
            />

          </aside>
        </Panel>
      </div>
    </div>
  )
}
