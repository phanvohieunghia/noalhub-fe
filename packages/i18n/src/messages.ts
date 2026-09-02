import { DEFAULT_LOCALE, type Locale } from "./config";
import { NAMESPACES, type Namespace } from "./namespaces";

export type MessageTree = { [key: string]: string | MessageTree };

/**
 * Load a single message file.
 *
 * A dynamic import with a template literal: both webpack and turbopack can read
 * this pattern and emit one chunk per file in `messages/`. Building the path
 * from an outside variable (`import(path)`) defeats the bundler, which then
 * bundles the whole directory into a single chunk.
 */
async function loadNamespace(
  locale: Locale,
  namespace: Namespace,
): Promise<MessageTree> {
  const mod = (await import(`../messages/${locale}/${namespace}.json`)) as {
    default: MessageTree;
  };
  return mod.default;
}

/**
 * Every message of a locale, for `getRequestConfig`.
 *
 * **Why the server loads all of them instead of filtering by route:**
 * `getRequestConfig` only receives the locale, not the pathname, so at that
 * layer there is no way to know the current route (the proxy has the pathname
 * but cannot put a header on the request where `headers()` would see it,
 * short of Next internals).
 *
 * Nothing is lost by it: these are **server** strings, they never enter the
 * browser bundle. The part that actually costs — the payload sent to the
 * client — is still cut per route by `pickMessages` in each layout (§5).
 */
export async function loadAllMessages(locale: Locale): Promise<MessageTree> {
  const tree: MessageTree = {};

  for (const namespace of NAMESPACES) {
    const messages = await loadNamespace(locale, namespace);
    const merged =
      locale === DEFAULT_LOCALE
        ? messages
        : deepMerge(await loadNamespace(DEFAULT_LOCALE, namespace), messages);
    assign(tree, namespace, merged);
  }

  return tree;
}

/**
 * Slice out exactly the namespaces a route group needs, to hand to
 * `NextIntlClientProvider`. This is where splitting into namespaces actually
 * pays off: the blog page never downloads chat's strings.
 */
export function pickMessages(
  messages: MessageTree,
  namespaces: readonly Namespace[],
): MessageTree {
  const out: MessageTree = {};
  for (const namespace of namespaces) {
    const value = read(messages, namespace);
    if (value) assign(out, namespace, value);
  }
  return out;
}

/**
 * Put `value` into the tree along a dotted path: `web.auth` → `{ web: { auth } }`.
 * `next-intl` reads a dot as a key path, so this is what makes
 * `useTranslations("web.auth")` find the `web.auth.json` file.
 */
function assign(tree: MessageTree, path: string, value: MessageTree): void {
  const parts = path.split(".");
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    node = typeof next === "object" && next !== null ? next : (node[part] = {});
  }
  node[parts[parts.length - 1]!] = value;
}

function read(tree: MessageTree, path: string): MessageTree | null {
  let node: string | MessageTree | undefined = tree;
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null) return null;
    node = node[part];
  }
  return typeof node === "object" && node !== null ? node : null;
}

/**
 * `vi` is the base every other locale is layered on.
 *
 * This is a production safety net, not a licence to leave strings out:
 * `pnpm --filter @noalhub/i18n check-messages` runs in CI and fails when `en`'s
 * key tree drifts from `vi` (§9). With it, a forgotten key renders as
 * Vietnamese rather than showing the raw key name to the user.
 */
function deepMerge(base: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      typeof value === "object" && typeof current === "object" && current !== null
        ? deepMerge(current, value)
        : value;
  }
  return out;
}
