import { DEFAULT_LOCALE } from "@noalhub/i18n/config";
import { IntlProvider } from "@noalhub/i18n/provider";
import { NavigationProgress } from "@noalhub/ui/navigation-progress";
import type { Metadata } from "next";

import { RootHtml, rootMetadata } from "../root-html";

/**
 * The second root layout, for `/auth/callback` only.
 *
 * This branch sits OUTSIDE `[locale]` because OAuth's `redirect_uri` is pinned
 * in the backend and in the Google/GitHub consoles — adding a locale prefix
 * there breaks sign-in (§10). In exchange it does not know the locale, so
 * `<html lang>` takes the default: this is a transition screen the user sees for
 * under a second.
 *
 * With two root layouts the repo **must not** have an `app/layout.tsx` —
 * `docs/01-app/01-getting-started/02-project-structure.md`.
 */
export const metadata: Metadata = rootMetadata;

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootHtml lang={DEFAULT_LOCALE}>
      <IntlProvider namespace="web.auth">
        <NavigationProgress />
        {children}
      </IntlProvider>
    </RootHtml>
  );
}
