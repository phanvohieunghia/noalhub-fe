import { ApiError, isForbidden, isRateLimited } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

/**
 * The message shown for an error on an admin screen — **one single place**, so
 * every page says the same thing about the same situation.
 *
 * Returns an **i18n key**, not a translated sentence: this function does not
 * run inside any request context and knows no locale. Components call
 * `useMessage()` to translate it (`docs/i18n.md` §7.3).
 *
 * Three cases are split out because the reader's next action differs entirely:
 * 403 (permission lost mid-session — sign in with another account), 429 (wait
 * and retry) and 404 (no such record). Without the 403 branch, losing a role
 * mid-session produces a blank screen — exactly what `docs/admin-plan.md` §1
 * rules out.
 */
export function adminErrorText(error: unknown): Message | string {
  if (isForbidden(error)) return { key: "common.errors.forbidden" };
  if (isRateLimited(error)) return { key: "common.errors.rateLimited" };

  if (error instanceof ApiError) {
    if (error.status === 404) return { key: "common.errors.notFound" };
    if (error.status === 0) return { key: "common.errors.network" };
    // `message` is written by the backend — for display only, never parse it.
    // It has no translation, so it shows verbatim even in the English UI (§7.3).
    return error.message;
  }

  return { key: "common.errors.generic" };
}
