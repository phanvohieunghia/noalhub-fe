import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

/**
 * Maps a backend error onto a form.
 *
 * `ErrorResponseDto.details` is a **list of sentences**, not a field → message
 * map (e.g. `["email must be an email"]`). We take the first token of each
 * sentence as the field name: that is the backend's class-validator
 * convention. A token matching no field in the form is pushed to the banner —
 * never swallowed.
 *
 * Returns the content for the form-level banner, or `null` when every error was
 * attached to an input. Backend-authored sentences pass through verbatim;
 * unrecognized cases return an i18n key for the component to translate
 * (`docs/i18n.md` §7.3).
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[] = [],
): Message | string | null {
  if (error instanceof ApiError) {
    if (error.code === ERROR_CODES.validationFailed && error.details?.length) {
      const unmatched: string[] = [];
      const seen = new Set<string>();

      for (const detail of error.details) {
        const field = detail.split(" ")[0];
        // Only attach when the field really exists in the form; otherwise
        // react-hook-form holds an error no input renders → the form is stuck
        // with nothing on screen.
        if (knownFields.includes(field) && !seen.has(field)) {
          seen.add(field);
          setError(field as Path<T>, { type: "server", message: detail });
        } else {
          unmatched.push(detail);
        }
      }

      return unmatched.length ? unmatched.join(". ") : null;
    }

    return error.message;
  }

  if (error instanceof Error) return error.message;
  return { key: "common.errors.unknown" };
}
