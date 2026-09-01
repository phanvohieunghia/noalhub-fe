import { z } from "zod";

import type { MediaKind } from "./types";

/* ------------------------------------------------------------------------- *
 * Allowlist — bản sao của `src/media/media-limits.ts` bên backend
 * ------------------------------------------------------------------------- */

/**
 * ⚠️ **Bản sao có chủ đích, và là bản sao thứ yếu.** Nguồn sự thật là
 * `media-limits.ts` bên `noalhub-be`; backend vẫn từ chối độc lập bằng
 * `MEDIA_MIME_NOT_ALLOWED` / `MEDIA_TOO_LARGE` dù FE có kiểm hay không.
 *
 * Giữ ở đây chỉ để **hỏng sớm và hỏng có nghĩa**: chọn nhầm một file 40MB thì
 * biết ngay lúc chọn, thay vì sau khi đã đẩy hết 40MB lên mạng rồi mới ăn 400.
 * Lệch với backend thì hậu quả là lỗi hiện muộn hơn — không phải lỗ hổng.
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
 * SVG chặt hơn hẳn ảnh thường: nhịp `complete` bên backend phải **đọc trọn
 * file** về để sanitize, chi phí đó nằm trên RAM của server — khác hẳn mọi mime
 * còn lại chỉ cần 512 byte đầu.
 */
export const SVG_MIME = "image/svg+xml";
export const SVG_MAX_BYTES = 512 * 1024;

/** Chỉ mime `kind === "image"` — dùng cho `accept` của input chèn ảnh. */
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
 * `null` = file dùng được. Ngược lại là câu giải thích cho người dùng.
 *
 * Nhận `File` chứ không nhận `{ type, size }` rời: hai tham số cùng đến từ một
 * vật thể thì tách ra chỉ tạo cơ hội truyền chéo nhau.
 */
export function describeMediaRejection(
  file: File,
  options: { allow?: readonly string[] } = {},
): string | null {
  const allow = options.allow ?? Object.keys(MEDIA_MIME_TO_KIND);
  if (!allow.includes(file.type)) {
    return `Định dạng "${file.type || "không xác định"}" không được phép. Cho phép: ${allow
      .map((mime) => mime.replace(/^[a-z]+\//, ""))
      .join(", ")}.`;
  }
  const max = maxBytesForMime(file.type);
  if (max !== null && file.size > max) {
    return `File ${formatBytes(file.size)} vượt giới hạn ${formatBytes(max)} cho định dạng này.`;
  }
  if (file.size === 0) return "File rỗng.";
  return null;
}

/* ------------------------------------------------------------------------- *
 * Schema phản hồi
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
