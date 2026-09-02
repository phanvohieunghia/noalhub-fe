import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";

/*
 * ⚠️ `globals.css` must be imported HERE, not in the two layout files.
 *
 * Before the root layout was split it lived in `app/layout.tsx`. That file is
 * gone (two root layouts — see the note below), and this is the only module
 * **both** root layouts pass through. Without this line the app still builds
 * green and still renders complete HTML, only without a single line of
 * Tailwind — and no error anywhere to trace it from.
 */
import "./globals.css";
import { appUrl } from "@noalhub/core/blog/seo";
import { THEME_INIT_SCRIPT } from "@noalhub/core/theme/script";
import { AuthProvider } from "@noalhub/ui/auth/auth-provider";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { ThemeProvider } from "@noalhub/ui/theme/theme-provider";

/**
 * The `<html>` shell shared by **both root layouts** of the app.
 *
 * The app has two root layouts because `<html lang>` must state the language
 * being rendered and `lang` lives on `<html>`: `app/[locale]/layout.tsx` knows
 * the locale, while `app/auth/layout.tsx` (the OAuth callback, deliberately
 * OUTSIDE `[locale]` because the `redirect_uri` is pinned in the backend and in
 * the Google/GitHub consoles) does not. With two root layouts there must be no
 * `app/layout.tsx` — see
 * `docs/01-app/01-getting-started/02-project-structure.md`.
 *
 * Fonts are declared at module scope, not inside the component:
 * `next/font/google` downloads the files at build time and needs one declaration
 * per variant; calling it in both layouts yields two `@font-face` sets for one
 * font.
 */

/**
 * `next/font/google` downloads the font files **at build time** and self-hosts
 * them alongside the static assets — the user's browser never calls Google, and
 * there is no FOUT because Next emits the `@font-face` and a preload.
 *
 * `subsets` MUST include `vietnamese`: without it, accented characters fall back
 * to the OS font and a single line shows two different typefaces.
 *
 * Open Sans is a variable font (300–800), so no `weight` is declared — every
 * weight is in one file, and `typography.tsx` only uses 400/500/600.
 */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/**
 * The ITALIC face has to be loaded separately. `next/font/google` does not take
 * a `style` array for variable fonts, and without it the browser **slants the
 * upright face itself** (synthetic oblique) — the stroke weights come out quite
 * wrong compared with Open Sans' real italic, most visibly on `a`, `e`, `g`.
 *
 * Both calls produce `font-family: "Open Sans"` and differ only in
 * `font-style`, so the `italic` utility picks the right face on its own — no
 * extra declaration at the call site. Nobody reads the
 * `--font-open-sans-italic` variable, but `.variable` must be on `<html>` for
 * Next to keep this `@font-face` at all.
 */
const openSansItalic = Open_Sans({
  variable: "--font-open-sans-italic",
  subsets: ["latin", "vietnamese"],
  style: "italic",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * ⚠️ `metadataBase` has been REQUIRED since the blog arrived: every relative URL
 * in `alternates.canonical` and `openGraph.images` is expanded to an absolute
 * URL against it. Missing → a build error on any route using relative URLs
 * (`docs/blog.md` §6.1).
 *
 * `appUrl()` reads `NEXT_PUBLIC_APP_URL`, which is **inlined at build time** —
 * so it must appear in the `env:` block of `.github/workflows/publish.yml` and
 * in `apps/web/Dockerfile`'s `build-args`, not in the VPS's `.env`.
 *
 * `title.template` applies only to CHILD routes; `title.default` is the title
 * when a route declares none — do not merge the two into one string.
 *
 * The description lives in `nav.json` rather than hardcoded here: it is a
 * user-readable string (it appears in search results), so it has to follow the
 * page's language. Whichever root layout knows the locale overrides
 * `description` itself.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Noalhub",
    template: "%s · Noalhub",
  },
};

export function RootHtml({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` is REQUIRED here: the script below adds the
    // `dark` class to this very element before React hydrates, so the server's
    // and the client's HTML differ by design.
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${openSans.variable} ${openSansItalic.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Synchronous, no `defer`/`async`, and it must come before everything
            else — it runs before the first paint so the page does not flash
            white and then go dark. The content is a repo constant; no user data
            is involved. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
