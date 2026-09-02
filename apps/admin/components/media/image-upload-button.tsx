"use client";

import { useId, useRef, useState } from "react";

import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import { messageOf, type Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import {
  MEDIA_IMAGE_MIMES,
  isStorageUploadError,
  useUploadMedia,
  type MediaAsset,
} from "@noalhub/api/media";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";

/**
 * The "Upload image" button — wrapping `useUploadMedia`'s whole three-step flow
 * in one place.
 *
 * Used by both places that need images (the cover field and the in-post image
 * dialog) rather than reimplemented: they differ only in what they do with the
 * returned `url`, while the hard parts — progress, cancellation and three
 * distinct error families — are identical.
 *
 * The `<input type="file">` is hidden and clicked through a ref: a file input
 * cannot be styled, and wrapping `<Button>` in a `<label>` nests a `<button>`
 * inside a label, which a screen reader announces as two controls.
 */
export function ImageUploadButton({
  onUploaded,
  label,
  disabled = false,
}: {
  onUploaded: (asset: MediaAsset) => void;
  /** Left out, the generic "Upload image" label is used. */
  label?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin.posts.upload");
  const tc = useTranslations("common.actions");
  const m = useMessage();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [error, setError] = useState<Message | string | null>(null);
  const upload = useUploadMedia({ allow: MEDIA_IMAGE_MIMES });

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    upload.mutate(file, {
      onSuccess: onUploaded,
      onError: (err) => setError(uploadErrorText(err)),
    });
  };

  const percent = upload.progress ? Math.round(upload.progress.ratio * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={MEDIA_IMAGE_MIMES.join(",")}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          // Reset so re-picking the SAME file still fires `change` (after a
          // failed upload, that is the most natural next action).
          event.target.value = "";
        }}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={disabled || upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? t("uploading", { percent }) : (label ?? t("label"))}
        </Button>
        {upload.isPending ? (
          <Button variant="outline" onClick={upload.cancel}>
            {tc("cancel")}
          </Button>
        ) : null}
      </div>

      {upload.isPending ? (
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
        >
          <div
            className="h-full bg-foreground transition-[width] duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}

      <FormError message={m(error)} />
    </div>
  );
}

/**
 * Three error families, three things to say — collapsing them into "Upload
 * failed" removes precisely the information that tells the user what to do next.
 *
 * 1. `MessageError`: the frontend rejected the file before calling the API
 *    (wrong format, too large) — it carries an i18n key, which `messageOf`
 *    extracts.
 * 2. `StorageUploadError`: step 2, i.e. MinIO. No error code exists in the
 *    contract.
 * 3. `ApiError`: step 1 or step 3.
 */
function uploadErrorText(error: unknown): Message | string {
  if (isStorageUploadError(error)) return error.message;

  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.mediaContentMismatch:
        return { key: "admin.posts.upload.contentMismatch" };
      case ERROR_CODES.mediaNotUploaded:
        return { key: "admin.posts.upload.notUploaded" };
      case ERROR_CODES.mediaTooLarge:
      case ERROR_CODES.mediaMimeNotAllowed:
        // The backend returns the allowlist and the real numbers in `message`.
        return error.message;
      default:
        return error.message || { key: "admin.posts.upload.failed" };
    }
  }

  return messageOf(error);
}
