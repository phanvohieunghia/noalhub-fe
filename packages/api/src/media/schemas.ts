import { z } from "zod";

import type { Message } from "../message";

import type { MediaKind } from "./types";

/* ------------------------------------------------------------------------- *
 * Allowlist — a copy of the backend's `src/media/media-limits.ts`
 * ------------------------------------------------------------------------- */

/**
 * ⚠️ **A deliberate copy, and the secondary one.** The source of truth is
 * `media-limits.ts` in `noalhub-be`; the backend rejects independently with
 * `MEDIA_MIME_NOT_ALLOWED` / `MEDIA_TOO_LARGE` whether or not the frontend
 * checks.
 *
 * It is kept here only to **fail early and fail meaningfully**: picking a 40MB
 * file by mistake is known at selection time rather than after pushing all
 * 40MB over the network and then taking a 400. Drift from the backend means an
 * error appears later — it is not a security hole.
 */
export const MEDIA_MIME_TO_KIND: Record<string, MediaKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/avif": "image",
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "application/pdf": "file",
  "application/zip": "file",
};

const MB = 1024 * 1024;

export const MEDIA_KIND_MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * MB,
  video: 200 * MB,
  file: 25 * MB,
};

/**
 * SVG is far more restricted than ordinary images: the backend's `complete`
 * step has to **read the whole file** back to sanitize it, and that cost lands
 * on the server's RAM — unlike every other mime, which only needs the first 512
 * bytes.
 */
export const SVG_MIME = "image/svg+xml";
export const SVG_MAX_BYTES = 512 * 1024;

/** Only the `kind === "image"` mimes — used for the image input's `accept`. */
export const MEDIA_IMAGE_MIMES = Object.keys(MEDIA_MIME_TO_KIND).filter(
  (mime) => MEDIA_MIME_TO_KIND[mime] === "image",
);

export function mediaKindOf(mime: string): MediaKind | null {
  return MEDIA_MIME_TO_KIND[mime] ?? null;
}

export function maxBytesForMime(mime: string): number | null {
  const kind = mediaKindOf(mime);
  if (!kind) return null;
  return mime === SVG_MIME ? SVG_MAX_BYTES : MEDIA_KIND_MAX_BYTES[kind];
}

function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${Math.round(bytes / MB)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * `null` means the file is usable. Otherwise it is an i18n key plus parameters
 * for the component to translate (`Message`), never a pre-translated sentence:
 * this function runs at module scope and knows no locale.
 *
 * It takes a `File` rather than a loose `{ type, size }`: two parameters coming
 * from one object only create the chance to pass them crossed over.
 */
export function describeMediaRejection(
  file: File,
  options: { allow?: readonly string[] } = {},
): Message | null {
  const allow = options.allow ?? Object.keys(MEDIA_MIME_TO_KIND);
  if (!allow.includes(file.type)) {
    return {
      key: "validation.file.typeNotAllowed",
      values: {
        type: file.type,
        allowed: allow.map((mime) => mime.replace(/^[a-z]+\//, "")).join(", "),
      },
    };
  }
  const max = maxBytesForMime(file.type);
  if (max !== null && file.size > max) {
    return {
      key: "validation.file.tooLarge",
      values: { size: formatBytes(file.size), max: formatBytes(max) },
    };
  }
  if (file.size === 0) return { key: "validation.file.empty" };
  return null;
}

/* ------------------------------------------------------------------------- *
 * Response schemas
 * ------------------------------------------------------------------------- */

const mediaKindSchema = z.enum(["image", "video", "file"]);

export const presignedUploadSchema = z.object({
  id: z.string(),
  kind: mediaKindSchema,
  uploadUrl: z.string(),
  expiresIn: z.number(),
});

export const mediaAssetSchema = z.object({
  id: z.string(),
  kind: mediaKindSchema,
  status: z.enum(["pending", "ready"]),
  url: z.string(),
  mime: z.string(),
  sizeBytes: z.number(),
  originalName: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  durationMs: z.number().nullable(),
  checksum: z.string().nullable(),
  createdAt: z.string(),
});
