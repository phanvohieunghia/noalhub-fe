import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

import { adminErrorText } from "../admin/error-message";

/**
 * Error messages for the blog screens in `apps/admin`. Returns an i18n key —
 * see `adminErrorText`.
 *
 * It wraps `adminErrorText` rather than replacing it: 403/429/404/offline still
 * say what they always said, and this only adds the blog-specific codes (§2.3)
 * where the author needs a concrete action instead of a generic sentence.
 */
export function blogErrorText(error: unknown): Message | string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.postConflict:
        return { key: "common.errors.postConflict" };
      case ERROR_CODES.slugTaken:
        return { key: "common.errors.slugTaken" };
      case ERROR_CODES.slugAliasNotFound:
        return { key: "common.errors.slugAliasNotFound" };
      case ERROR_CODES.postNotPublishable:
        // The backend lists the missing fields in `message`; keep that sentence.
        return {
          key: "common.errors.postNotPublishable",
          values: { message: error.message },
        };
      case ERROR_CODES.categorySlugTaken:
        return { key: "common.errors.categorySlugTaken" };
      case ERROR_CODES.categoryNotEmpty:
        // The backend's `message` includes the post count — exactly what the user needs.
        return error.message;
      default:
        break;
    }
  }

  return adminErrorText(error);
}
