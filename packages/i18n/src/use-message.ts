"use client";

import { isMessage, type Message } from "@noalhub/api/message";
import { useTranslations } from "next-intl";

/**
 * Translates messages **produced by the data layer** rather than written by a
 * component: zod messages in `@noalhub/api`'s `schemas.ts` files, and the
 * output of the `ErrorText` helpers in `packages/core`.
 *
 * Why those are keys and not sentences: schemas and error mappers run at module
 * scope, loaded once at import time, with no request locale in sight
 * (`docs/i18n.md` §7.3). So they say `"validation.email.invalid"`, and the
 * translation happens here — at render time, in the right locale.
 *
 * A string matching no key passes straight through: that is a sentence written
 * by the **backend**, which has no translation and is shown verbatim (§7.3
 * accepts this for now).
 */
export function useMessage() {
  const t = useTranslations();

  return (message?: Message | string | null): string | undefined => {
    if (!message) return undefined;
    const key = isMessage(message) ? message.key : message;
    const values = isMessage(message) ? message.values : undefined;

    /*
     * The cast is required, and belongs only here: the key comes from runtime
     * (a zod schema, an error mapper), so next-intl's static key type cannot
     * check it. In exchange `has()` checks right before translating, so a bad
     * key renders as the key string instead of throwing.
     */
    const translate = t as unknown as {
      (key: string, values?: Record<string, string | number>): string;
      has: (key: string) => boolean;
    };

    return translate.has(key) ? translate(key, values) : key;
  };
}
