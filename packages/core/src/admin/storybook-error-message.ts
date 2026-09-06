import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

import { adminErrorText } from "./error-message";

/**
 * Error messages for the internal-Storybook access screen. Returns an i18n key —
 * see `adminErrorText`, which this wraps rather than replaces, so 403/429/offline
 * keep saying what they say everywhere else.
 *
 * Only the conflict is special-cased. It is the one error with a next action the
 * reader can take ("that email is already on the list" → close the dialog, the
 * job is done), whereas 404 on revoke means someone else already removed the
 * row, and the generic "it may have just been deleted" sentence is exactly right
 * for that.
 */
export function storybookErrorText(error: unknown): Message | string {
  if (
    error instanceof ApiError &&
    error.code === ERROR_CODES.storybookAccessConflict
  ) {
    return { key: "common.errors.storybookAccessConflict" };
  }

  return adminErrorText(error);
}
