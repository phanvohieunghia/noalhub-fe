import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * The replacements for `next/link` and `next/navigation` in **`apps/web`**:
 * they prepend the current locale to every path.
 *
 * `import Link from "next/link"` in web points at an unprefixed URL, so the
 * proxy has to spend another redirect on it — losing scroll position, and for
 * a server-side `redirect()` falling all the way back to `vi`
 * (`docs/i18n.md` §10).
 *
 * `apps/admin` is the opposite: it uses `next/link` as usual, because admin
 * URLs carry no locale.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
