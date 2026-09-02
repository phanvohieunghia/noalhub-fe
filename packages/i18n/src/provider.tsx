import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { type MessageTree, pickMessages } from "./messages";
import { SHARED_NAMESPACES, type Namespace } from "./namespaces";

/**
 * Hands messages down to Client Components — but only **this route's
 * namespace**, not the whole store (`docs/i18n.md` §5).
 *
 * Server Components need no provider: `getTranslations` reads straight from
 * `getRequestConfig`. The provider exists only because the client has no other
 * way to get messages than having them serialized into the payload — so every
 * extra string here is extra bytes over the wire for **everyone** who opens the
 * page.
 *
 * Place it in the layout closest to the route. With nested providers the
 * innermost wins, so `namespace` must be that route's own namespace;
 * `common`/`nav`/`validation` are always included.
 */
export async function IntlProvider({
  namespace,
  children,
}: {
  namespace?: Namespace;
  children: React.ReactNode;
}) {
  const messages = (await getMessages()) as MessageTree;
  const namespaces = namespace
    ? [...SHARED_NAMESPACES, namespace]
    : [...SHARED_NAMESPACES];

  return (
    <NextIntlClientProvider messages={pickMessages(messages, namespaces)}>
      {children}
    </NextIntlClientProvider>
  );
}
