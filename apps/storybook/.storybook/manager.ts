import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/**
 * Sidebar branding for the Storybook shell (the "manager" UI, which lives
 * outside the preview iframe and therefore outside our Tailwind/theme tokens).
 *
 * The mark is inlined as a data URI rather than served from a static dir:
 * `brandImage` takes a URL, and the manager is built separately from the
 * stories, so an inline copy avoids wiring `staticDirs` for a single 300-byte
 * asset. It mirrors the apps' `app/icon.svg` — fixed brand colors, because the
 * manager chrome has no access to our CSS variables. Keep it in sync with
 * `packages/ui/src/logo.tsx` if the mark ever changes.
 */
const brandMark =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
      '<path fill="#006066" d="M96 0H24C10.7452 0 0 10.7452 0 24V96C0 109.255 10.7452 120 24 120H96C109.255 120 120 109.255 120 96V24C120 10.7452 109.255 0 96 0Z"/>' +
      '<path fill="#ffffff" d="M32 88V32H48L88 76V32V88H72L32 44V88Z"/>' +
      "</svg>",
  );

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Noalhub UI",
    brandUrl: "/",
    brandImage: brandMark,
    brandTarget: "_self",
    colorPrimary: "#006066",
    colorSecondary: "#006066",
  }),
});
