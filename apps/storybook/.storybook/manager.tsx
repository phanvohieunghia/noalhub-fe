import React from 'react'
import {addons, types, useGlobals} from 'storybook/manager-api'
import {IconButton} from 'storybook/internal/components'
import {create} from 'storybook/theming'

/**
 * Sidebar branding for the Storybook shell (the "manager" UI, which lives
 * outside the preview iframe and therefore outside our Tailwind/theme tokens).
 *
 * `brandImage` replaces the title text entirely, so the wordmark is drawn into
 * the same SVG as the mark rather than left to `brandTitle` (which then only
 * serves as the image's alt text). The intrinsic `width`/`height` keep it at
 * 24px tall — Storybook only caps the height, it does not set one, so an image
 * without them renders as tall as the sidebar header allows.
 *
 * Inlined as a data URI rather than served from `public/`: the manager bundle is
 * built separately from the stories, and this keeps the mark in one file with
 * the theme that uses it. Colors are fixed (the manager chrome has no access to
 * our CSS variables) and the theme `base` is pinned to light so the wordmark
 * stays legible. Keep the paths in sync with `packages/ui/src/logo.tsx`.
 */
const brandMark =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="118" height="24" viewBox="0 0 118 24">' +
      '<g transform="scale(0.2)">' +
      '<rect width="120" height="120" rx="28" fill="#0c3139"/>' +
      '<g transform="translate(22 23.32) scale(0.2)">' +
      '<path fill="#3d96a9" d="M88.0996 0L185.4 97.31V152.53L88.0996 56.54V0Z"/>' +
      '<path fill="#3d96a9" d="M89.41 95.99L117.02 123.6L56.54 185.4L138.06 268.24L176.19 230.11V286.65L138.06 323.46L0 185.4L89.41 95.99Z"/>' +
      '<path fill="#3d96a9" d="M239.31 132.81L286.64 177.51L239.31 226.16L211.7 198.55L231.42 178.83L211.7 157.79L239.31 132.81Z"/>' +
      '<path fill="#81d7eb" d="M243.25 39.45L380 177.51L289.27 269.55L262.98 243.26L323.46 177.51L243.25 95.99L203.81 134.12V78.9L243.25 39.45Z"/>' +
      '<path fill="#81d7eb" d="M193.29 211.7L289.27 309V366.86L193.29 269.55V211.7Z"/>' +
      '<path fill="#81d7eb" d="M140.69 139.38L168.3 165.68L151.21 185.4L168.3 203.81L140.69 231.42L94.6699 185.4L140.69 139.38Z"/>' +
      '</g>' +
      '</g>' +
      '<text x="32" y="17" fill="#2e3438" font-family="Nunito Sans, -apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">Noalhub UI</text>' +
      '</svg>',
  )

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Noalhub UI',
    brandUrl: '/',
    brandImage: brandMark,
    brandTarget: '_self',
    colorPrimary: '#006066',
    colorSecondary: '#006066',
  }),
})

/**
 * Toolbar button pointing at the internal build (`/internal/`), so nobody has to
 * be told the URL exists.
 *
 * Hidden only when already under `/internal/` — the link would otherwise point
 * at `/internal/internal/`. That check reads the URL at runtime rather than
 * `SB_AUDIENCE`, because the manager is bundled separately from the preview and
 * `main.ts`'s DefinePlugin never reaches it.
 *
 * On localhost the button stays visible and 404s: `pnpm dev` serves no such
 * path. That is deliberate — hiding it there meant the button vanished exactly
 * when someone was building or reviewing it, which cost more confusion than the
 * dead click does. The tooltip says so.
 *
 * Clicking it while signed out lands on the Google login that the backend puts
 * in front of that path; access itself is decided by the backend, never here.
 * A plain `<a>` doing a full page load, not a router push: `/internal/` is a
 * different Storybook build, a different document.
 */
const INTERNAL_PATH = '/internal/'

/**
 * Button labels, following the language toolbar.
 *
 * `next-intl` is unusable here: the manager lives OUTSIDE the preview iframe, so
 * it has no `NextIntlClientProvider`, and its bundle does not load
 * `packages/i18n` either. The only thing that crosses that boundary is
 * Storybook's **globals** — `useGlobals()` reads exactly the value the toolbar
 * has selected (`preview.tsx` declares `globalTypes.locale`).
 *
 * For four strings a local table beats adding keys to
 * `packages/i18n/messages/`: that is the place for PRODUCT copy, this is copy for
 * an internal tool, and every key added there is one more key
 * `pnpm check-messages` forces both locales to carry.
 */
const LABELS = {
  vi: {
    title: 'Storybook nội bộ',
    label: 'Nội bộ',
    aria: 'Mở Storybook nội bộ',
    tooltipLocal: 'Chỉ có trên bản đã deploy',
    tooltipRemote: 'Cần đăng nhập Google',
  },
  en: {
    title: 'Internal Storybook',
    label: 'Internal',
    aria: 'Open the internal Storybook',
    tooltipLocal: 'Only exists on the deployed build',
    tooltipRemote: 'Requires a Google sign-in',
  },
} as const

const isLocal = () =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

/**
 * A real component rather than JSX inlined in `render`: `useGlobals` is a hook and
 * needs an actual component for React to register it — putting a hook inside an
 * arrow function that is merely called breaks the rules of hooks.
 */
function InternalLink() {
  const [globals] = useGlobals()
  const t = globals.locale === 'en' ? LABELS.en : LABELS.vi

  return (
    // `asChild`: IconButton renders a <button>, but this is navigation to a
    // different document rather than an action — it has to be a real <a> so it can
    // be opened in a new tab, have its link copied, and be announced as a link by
    // screen readers.
    <IconButton
      asChild
      ariaLabel={t.aria}
      tooltip={isLocal() ? t.tooltipLocal : t.tooltipRemote}>
      <a href={INTERNAL_PATH}>
        {/* Inlined SVG instead of `@storybook/icons`: that package is a transitive
            dependency of `storybook`, and adding it to package.json just for one
            padlock pins another version to keep an eye on. */}
        <svg
          width={13}
          height={13}
          viewBox="0 0 14 14"
          fill="currentColor"
          aria-hidden>
          <path d="M4 6V4.5a3 3 0 1 1 6 0V6h.5A1.5 1.5 0 0 1 12 7.5v4A1.5 1.5 0 0 1 10.5 13h-7A1.5 1.5 0 0 1 2 11.5v-4A1.5 1.5 0 0 1 3.5 6H4Zm1.5 0h3V4.5a1.5 1.5 0 1 0-3 0V6Z" />
        </svg>
        {t.label}
      </a>
    </IconButton>
  )
}

addons.add('noalhub/internal-link', {
  type: types.TOOL,
  // Only a label in Storybook's addon list, never rendered in the UI — so it is
  // static and cannot follow the toolbar.
  title: LABELS.vi.title,
  // `match` re-runs on every story change; our condition does not vary per story,
  // so reading the URL once here is enough.
  match: () => !window.location.pathname.startsWith(INTERNAL_PATH),
  render: () => <InternalLink />,
})

/**
 * Viewport shortcuts: Alt+1…4 pick Small mobile / Large mobile / Tablet /
 * Desktop, Alt+0 resets — Storybook ships none for the viewport menu.
 *
 * Matched on `event.code` (`Digit1`), not `event.key`: on macOS Alt+1 types
 * "¡", so `key` never equals "1". Ignored while typing in a field. The preview
 * iframe is a separate document, so a key pressed with focus inside it never
 * reaches this listener; click the sidebar or toolbar first.
 */
const VIEWPORT_KEYS: Record<string, string | undefined> = {
  Digit0: undefined,
  Digit1: 'mobile1',
  Digit2: 'mobile2',
  Digit3: 'tablet',
  Digit4: 'desktop',
}

addons.register('noalhub/viewport-shortcuts', (api) => {
  window.addEventListener('keydown', (event) => {
    if (!event.altKey || event.ctrlKey || event.metaKey) return
    if (!(event.code in VIEWPORT_KEYS)) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable]')) return

    event.preventDefault()
    const value = VIEWPORT_KEYS[event.code]
    api.updateGlobals({
      viewport: value ? {value, isRotated: false} : undefined,
    })
  })
})

/**
 * Writes the shortcut next to each item of Storybook's viewport menu.
 *
 * The menu is Storybook's own and has no slot for a hint, so this decorates its
 * DOM: every time a menu opens, the items whose label matches a viewport name
 * get a muted `Alt+N` appended. Matching on the visible text is brittle by
 * nature — if a label changes upstream the hint simply does not appear, nothing
 * breaks. Keep the labels in step with `VIEWPORT_KEYS` above.
 */
const VIEWPORT_HINTS: Record<string, string> = {
  'Reset viewport': '⌥0',
  'Small mobile': '⌥1',
  'Large mobile': '⌥2',
  Tablet: '⌥3',
  Desktop: '⌥4',
}

new MutationObserver(() => {
  document
    .querySelectorAll<HTMLElement>('[role="listbox"] [role="option"]')
    .forEach((el) => {
      if (el.dataset.shortcutHint) return
      const hint = VIEWPORT_HINTS[el.textContent?.trim() ?? '']
      if (!hint) return
      el.dataset.shortcutHint = hint
      const span = document.createElement('span')
      span.textContent = hint
      span.style.cssText =
        'position:absolute;right:12px;top:50%;transform:translateY(-50%);opacity:.55;font-size:11px;pointer-events:none'
      el.style.position = 'relative'
      el.style.paddingRight = '44px'
      el.appendChild(span)
    })
}).observe(document.body, {childList: true, subtree: true})
