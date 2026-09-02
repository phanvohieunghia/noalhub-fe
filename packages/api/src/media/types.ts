/**
 * The `media` feature — asset uploads (images for now, video/files later).
 *
 * Contract: tag `admin-media` in `/docs-json`; the full design lives in
 * `docs/media.md` in the `noalhub-be` repo. Every endpoint needs a token plus
 * the `admin` role.
 */

/**
 * The backend **derives `kind` from the approved mime**; the client never sends
 * it. Allowing it to be sent would mean the backend has to verify it matches
 * the mime, and forgetting that check is a hole for bypassing the size limit
 * (declare `video` to claim the 200MB budget, then upload a zip that is capped
 * at 25MB). Here the type is used only to **read** responses.
 */
export type MediaKind = "image" | "video" | "file";

export type MediaStatus = "pending" | "ready";

/** The step 1 response — the ticket letting the browser `PUT` to storage itself. */
export type PresignedUpload = {
  id: string;
  kind: MediaKind;
  /**
   * The browser `PUT`s **straight** here, never through the backend. It must
   * send exactly the declared `Content-Type` and `Content-Length`: both are part
   * of what was signed, and getting either wrong is a 403 from storage, not an
   * API error.
   */
  uploadUrl: string;
  /**
   * ⚠️ Not a deadline for *starting* the upload — it covers the **entire** PUT
   * request, and a large PUT lasts for the whole transfer.
   */
  expiresIn: number;
};

/** The step 3 response. `url` is the string dropped into the post. */
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  /** A pure function of the backend's `MEDIA_PUBLIC_URL` + `storageKey`. */
  url: string;
  mime: string;
  /** The real number from `HeadObject`, not what the client declared in step 1. */
  sizeBytes: number;
  originalName: string | null;
  /** Always `null` in this round — the backend does not decode media to read dimensions yet. */
  width: number | null;
  height: number | null;
  durationMs: number | null;
  checksum: string | null;
  createdAt: string;
};

/** Step 2's progress. `total` is 0 when the browser cannot report a length. */
export type UploadProgress = {
  loaded: number;
  total: number;
  /** 0–1. Zero when `total` is unknown. */
  ratio: number;
};

/**
 * A **step 2** failure — that is, storage's, not the API's.
 *
 * `ApiError` is not reused: it describes the backend's `ErrorResponseDto`
 * (stable `code`, `details`), while MinIO answers with XML and has no code in
 * that contract. Merging the two into one class invites someone to `switch` on
 * a `code` that does not exist.
 */
export class StorageUploadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "StorageUploadError";
    this.status = status;
  }
}

/** An error from step 2 (storage) rather than from the API — see `StorageUploadError`. */
export function isStorageUploadError(
  error: unknown,
): error is StorageUploadError {
  return error instanceof StorageUploadError;
}
