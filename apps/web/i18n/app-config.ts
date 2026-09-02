/**
 * Turns on typing for message keys in this app.
 *
 * The "empty" import is deliberate: `@noalhub/i18n/app-config` declares
 * `declare module "next-intl"`, and module augmentation only takes effect while
 * the file holding it is in the project's import graph. Delete this line and
 * every `t("wrong.key")` compiles again (`docs/i18n.md` §9).
 */
import "@noalhub/i18n/app-config";
