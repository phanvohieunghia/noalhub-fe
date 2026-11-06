/**
 * The coloured field behind the public panels (`Panel` on `bg-field`): four
 * drifting aurora glows plus the reading-room dome engraving in `--field-ink`.
 * Markup only — the dome's GSAP drift and scroll parallax belong to the app's
 * `HomeField`, which passes `domeRef`. The CSS (`.field-dome`, the aurora
 * keyframes) is `packages/config/field.css`.
 *
 * `fixed` in the app so the panels slide over it and it never shows an edge;
 * `absolute` inside a positioned, `isolate`d box, which is how Storybook uses it
 * so it does not cover the rest of the page.
 *
 * Soft radial gradients, NOT `blur-*`: a CSS blur on viewport-sized,
 * always-animated layers costs ~60ms a frame (14fps measured).
 */
export function FieldBackdrop({
  domeRef,
  position = 'fixed',
}: {
  domeRef?: React.Ref<HTMLDivElement>
  position?: 'fixed' | 'absolute'
}) {
  return (
    <div
      aria-hidden
      className={`bg-field pointer-events-none inset-0 -z-10 overflow-hidden ${position}`}>
      <div className="animate-field-aurora-1 absolute -top-[25%] -left-[15%] h-[85vh] w-[85vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-200)_50%,transparent),color-mix(in_srgb,var(--color-brand-200)_28%,transparent)_45%,transparent)] will-change-transform dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-500)_25%,transparent),color-mix(in_srgb,var(--color-brand-500)_14%,transparent)_45%,transparent)]" />
      <div className="animate-field-aurora-2 absolute -right-[15%] -bottom-[25%] h-[90vh] w-[90vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-300)_45%,transparent),color-mix(in_srgb,var(--color-brand-300)_25%,transparent)_45%,transparent)] will-change-transform dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-400)_25%,transparent),color-mix(in_srgb,var(--color-brand-400)_14%,transparent)_45%,transparent)]" />
      <div className="animate-field-aurora-3 absolute top-[20%] left-[25%] h-[65vh] w-[65vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-400)_40%,transparent),color-mix(in_srgb,var(--color-brand-400)_22%,transparent)_45%,transparent)] will-change-transform dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-600)_30%,transparent),color-mix(in_srgb,var(--color-brand-600)_16%,transparent)_45%,transparent)]" />
      <div className="animate-field-aurora-4 absolute top-[5%] right-[10%] h-[55vh] w-[55vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-100)_45%,transparent),color-mix(in_srgb,var(--color-brand-100)_25%,transparent)_45%,transparent)] will-change-transform dark:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand-700)_25%,transparent),color-mix(in_srgb,var(--color-brand-700)_14%,transparent)_45%,transparent)]" />

      <div
        ref={domeRef}
        className="field-dome absolute -inset-[16%] will-change-transform"
      />
    </div>
  )
}
