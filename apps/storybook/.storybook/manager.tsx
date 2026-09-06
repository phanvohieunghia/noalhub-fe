import React from "react";
import { addons, types, useGlobals } from "storybook/manager-api";
import { IconButton } from "storybook/internal/components";
import { create } from "storybook/theming";

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
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="118" height="24" viewBox="0 0 118 24">' +
      '<g transform="scale(0.2)">' +
      '<path fill="#006066" d="M96 0H24C10.7452 0 0 10.7452 0 24V96C0 109.255 10.7452 120 24 120H96C109.255 120 120 109.255 120 96V24C120 10.7452 109.255 0 96 0Z"/>' +
      '<path fill="#ffffff" d="M32 88V32H48L88 76V32V88H72L32 44V88Z"/>' +
      "</g>" +
      '<text x="32" y="17" fill="#2e3438" font-family="Nunito Sans, -apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">Noalhub UI</text>' +
      "</svg>",
  );

addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "Noalhub UI",
    brandUrl: "/",
    brandImage: brandMark,
    brandTarget: "_self",
    colorPrimary: "#006066",
    colorSecondary: "#006066",
  }),
});

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
const INTERNAL_PATH = "/internal/";

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
    title: "Storybook nội bộ",
    label: "Nội bộ",
    aria: "Mở Storybook nội bộ",
    tooltipLocal: "Chỉ có trên bản đã deploy",
    tooltipRemote: "Cần đăng nhập Google",
  },
  en: {
    title: "Internal Storybook",
    label: "Internal",
    aria: "Open the internal Storybook",
    tooltipLocal: "Only exists on the deployed build",
    tooltipRemote: "Requires a Google sign-in",
  },
} as const;

const isLocal = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

/**
 * A real component rather than JSX inlined in `render`: `useGlobals` is a hook and
 * needs an actual component for React to register it — putting a hook inside an
 * arrow function that is merely called breaks the rules of hooks.
 */
function InternalLink() {
  const [globals] = useGlobals();
  const t = globals.locale === "en" ? LABELS.en : LABELS.vi;

  return (
    // `asChild`: IconButton renders a <button>, but this is navigation to a
    // different document rather than an action — it has to be a real <a> so it can
    // be opened in a new tab, have its link copied, and be announced as a link by
    // screen readers.
    <IconButton
      asChild
      ariaLabel={t.aria}
      tooltip={isLocal() ? t.tooltipLocal : t.tooltipRemote}
    >
      <a href={INTERNAL_PATH}>
        {/* Inlined SVG instead of `@storybook/icons`: that package is a transitive
            dependency of `storybook`, and adding it to package.json just for one
            padlock pins another version to keep an eye on. */}
        <svg width={13} height={13} viewBox="0 0 14 14" fill="currentColor" aria-hidden>
          <path d="M4 6V4.5a3 3 0 1 1 6 0V6h.5A1.5 1.5 0 0 1 12 7.5v4A1.5 1.5 0 0 1 10.5 13h-7A1.5 1.5 0 0 1 2 11.5v-4A1.5 1.5 0 0 1 3.5 6H4Zm1.5 0h3V4.5a1.5 1.5 0 1 0-3 0V6Z" />
        </svg>
        {t.label}
      </a>
    </IconButton>
  );
}

addons.add("noalhub/internal-link", {
  type: types.TOOL,
  // Only a label in Storybook's addon list, never rendered in the UI — so it is
  // static and cannot follow the toolbar.
  title: LABELS.vi.title,
  // `match` re-runs on every story change; our condition does not vary per story,
  // so reading the URL once here is enough.
  match: () => !window.location.pathname.startsWith(INTERNAL_PATH),
  render: () => <InternalLink />,
});
