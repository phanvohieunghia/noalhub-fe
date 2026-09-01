import { http } from "../client";
import { mediaAssetSchema, presignedUploadSchema } from "./schemas";
import { StorageUploadError } from "./types";
import type { MediaAsset, PresignedUpload, UploadProgress } from "./types";

/**
 * Đường **client** của feature media — chỉ `apps/admin` dùng. Contract:
 * tag `admin-media` trong `/docs-json`, thiết kế ở `docs/media.md` bên
 * `noalhub-be`.
 *
 * ### Vì sao không có `POST /media/upload` nhận file
 *
 * Vì backend cố ý không có endpoint đó: file sẽ đi qua RAM của Nest, đúng thứ
 * kiến trúc storage chọn MinIO để tránh. Đổi lại là luồng **ba nhịp** dưới đây,
 * mà nhịp 2 không nói chuyện với backend chút nào.
 */

/**
 * Nhịp 1 — POST /admin/media/presign → 201.
 * 400 `MEDIA_MIME_NOT_ALLOWED` (body kèm allowlist), 400 `MEDIA_TOO_LARGE`.
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
 * Nhịp 3 — POST /admin/media/{id}/complete → 200.
 * 400 `MEDIA_NOT_UPLOADED` | `MEDIA_CONTENT_MISMATCH` | `MEDIA_TOO_LARGE`,
 * 404 `MEDIA_ASSET_NOT_FOUND`.
 *
 * **Idempotent** ở backend: gọi lại trên asset đã `ready` trả về nguyên trạng.
 * Nhờ vậy FE cứ retry sau khi mất mạng giữa chừng mà không sợ hỏng dữ liệu.
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
 * Nhịp 2 — browser `PUT` thẳng lên storage.
 *
 * ⚠️ **Không dùng `http` (axios instance) ở đây.** Ba lý do, mỗi lý do đủ để
 * hỏng: `baseURL` sẽ nối `uploadUrl` vào sau origin của API; interceptor gắn
 * `Authorization` — một header **không nằm trong chữ ký** presigned, và gửi
 * kèm token của mình sang một origin khác là chuyện không nên làm dù storage có
 * bỏ qua nó; và interceptor 401 sẽ đi refresh token vì một mã 403 của storage.
 *
 * Dùng `XMLHttpRequest` chứ không phải `fetch`: `fetch` **không** báo tiến độ
 * upload (`ReadableStream` request body chưa dùng được rộng rãi), mà một video
 * 200MB không có thanh tiến độ thì người dùng chỉ thấy app treo.
 *
 * `Content-Type` phải khớp **đúng** thứ đã khai ở nhịp 1: nó nằm trong phần
 * được ký. `Content-Length` trình duyệt tự đặt từ body, không set tay được.
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
       * 403 ở đây gần như luôn là một trong ba thứ, và cả ba đều KHÔNG phải lỗi
       * người dùng: URL đã hết hạn (`expiresIn` là hạn cho toàn bộ PUT), chữ ký
       * sai vì `Host` khác lúc ký, hoặc đồng hồ máy lệch. Nói thẳng ra để người
       * gặp không đi tìm bug ở chỗ khác.
       */
      reject(
        new StorageUploadError(
          xhr.status,
          xhr.status === 403
            ? "common.errors.storageForbidden"
            : `Storage trả ${xhr.status} khi tải file lên.`,
        ),
      );
    };

    // Lỗi mạng: `status` là 0 và không có body nào để đọc.
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
 * Cả ba nhịp trong một lời gọi — đơn vị mà UI thực sự cần.
 *
 * Gói ở tầng api chứ không ở hook: nó là **trình tự của contract**, không phải
 * logic React. Nhờ vậy một script hay server action cũng gọi được.
 *
 * Thất bại ở nhịp 2 hoặc 3 để lại một row `pending` bên backend; **không** cố
 * dọn từ FE (không có endpoint xoá, và cũng không nên có): job dọn của backend
 * xoá nó sau 24h.
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
      // Chỉ để hiển thị ở phía backend; nó KHÔNG tham gia vào storage key.
      originalName: file.name || null,
    },
    signal,
  );

  await putToStorage({ uploadUrl: ticket.uploadUrl, file, onProgress, signal });

  return completeMedia(ticket.id, signal);
}
