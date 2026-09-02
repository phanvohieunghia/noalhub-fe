import { http } from "../client";
import { mediaAssetSchema, presignedUploadSchema } from "./schemas";
import { StorageUploadError } from "./types";
import type { MediaAsset, PresignedUpload, UploadProgress } from "./types";

/**
 * The media feature's **client** path — used only by `apps/admin`. Contract:
 * tag `admin-media` in `/docs-json`, designed in `docs/media.md` over in
 * `noalhub-be`.
 *
 * ### Why there is no `POST /media/upload` that takes a file
 *
 * Because the backend deliberately has no such endpoint: the file would pass
 * through Nest's RAM, precisely what choosing MinIO for storage was meant to
 * avoid. The trade is the **three-step** flow below, whose second step never
 * talks to the backend at all.
 */

/**
 * Step 1 — POST /admin/media/presign → 201.
 * 400 `MEDIA_MIME_NOT_ALLOWED` (the body carries the allowlist),
 * 400 `MEDIA_TOO_LARGE`.
 */
export async function presignMedia(
  input: { mime: string; sizeBytes: number; originalName?: string | null },
  signal?: AbortSignal,
): Promise<PresignedUpload> {
  const { data } = await http.post<PresignedUpload>("/admin/media/presign", input, {
    authRequired: true,
    schema: presignedUploadSchema,
    signal,
  });
  return data;
}

/**
 * Step 3 — POST /admin/media/{id}/complete → 200.
 * 400 `MEDIA_NOT_UPLOADED` | `MEDIA_CONTENT_MISMATCH` | `MEDIA_TOO_LARGE`,
 * 404 `MEDIA_ASSET_NOT_FOUND`.
 *
 * **Idempotent** on the backend: calling it again on an already-`ready` asset
 * returns it unchanged. So the frontend can retry after a mid-flight network
 * drop without risking the data.
 */
export async function completeMedia(
  id: string,
  signal?: AbortSignal,
): Promise<MediaAsset> {
  const { data } = await http.post<MediaAsset>(
    `/admin/media/${encodeURIComponent(id)}/complete`,
    undefined,
    { authRequired: true, schema: mediaAssetSchema, signal },
  );
  return data;
}

/**
 * Step 2 — the browser `PUT`s straight to storage.
 *
 * ⚠️ **Do not use `http` (the axios instance) here.** Three reasons, any one of
 * them fatal: `baseURL` would append `uploadUrl` to the API's origin; the
 * interceptor attaches `Authorization` — a header **outside the presigned
 * signature**, and sending your own token to a different origin is a bad idea
 * even if storage ignores it; and the 401 interceptor would go refresh the
 * token over a 403 that came from storage.
 *
 * `XMLHttpRequest` rather than `fetch`: `fetch` reports **no** upload progress
 * (a `ReadableStream` request body is not broadly usable yet), and a 200MB
 * video with no progress bar just looks like a frozen app.
 *
 * `Content-Type` must match **exactly** what was declared in step 1: it is part
 * of what was signed. `Content-Length` is set by the browser from the body and
 * cannot be set by hand.
 */
export function putToStorage(params: {
  uploadUrl: string;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { uploadUrl, file, onProgress, signal } = params;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const total = event.lengthComputable ? event.total : 0;
      onProgress({
        loaded: event.loaded,
        total,
        ratio: total > 0 ? event.loaded / total : 0,
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      /*
       * A 403 here is almost always one of three things, none of them the
       * user's fault: the URL expired (`expiresIn` covers the entire PUT), the
       * signature is wrong because `Host` differs from signing time, or the
       * machine's clock is off. Say so plainly, so whoever hits it does not go
       * hunting for a bug elsewhere.
       */
      reject(
        new StorageUploadError(
          xhr.status,
          xhr.status === 403
            ? "common.errors.storageForbidden"
            : `Storage answered ${xhr.status} while uploading the file.`,
        ),
      );
    };

    // A network failure: `status` is 0 and there is no body to read.
    xhr.onerror = () =>
      reject(new StorageUploadError(0, "common.errors.uploadDisconnected"));
    xhr.onabort = () => reject(new StorageUploadError(0, "common.errors.uploadAborted"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(file);
  });
}

/**
 * All three steps in one call — the unit the UI actually needs.
 *
 * Packaged in the api layer rather than a hook: it is **the contract's
 * sequence**, not React logic. So a script or a server action can call it too.
 *
 * A failure at step 2 or 3 leaves a `pending` row on the backend; do **not**
 * try to clean it from the frontend (there is no delete endpoint, and there
 * should not be): the backend's cleanup job removes it after 24h.
 */
export async function uploadMedia(params: {
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}): Promise<MediaAsset> {
  const { file, onProgress, signal } = params;

  const ticket = await presignMedia(
    {
      mime: file.type,
      sizeBytes: file.size,
      // For display on the backend only; it takes NO part in the storage key.
      originalName: file.name || null,
    },
    signal,
  );

  await putToStorage({ uploadUrl: ticket.uploadUrl, file, onProgress, signal });

  return completeMedia(ticket.id, signal);
}
