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
 * Nút "Tải ảnh lên" — bọc trọn luồng ba nhịp của `useUploadMedia` vào một chỗ.
 *
 * Dùng ở cả hai nơi cần ảnh (ô ảnh bìa và dialog chèn ảnh trong bài) thay vì
 * viết lại: chúng khác nhau đúng ở việc làm gì với `url` trả về, mà phần khó —
 * tiến độ, huỷ, và ba họ lỗi khác nhau — thì giống hệt.
 *
 * `<input type="file">` bị ẩn và bấm bằng ref: input file mặc định không style
 * được, còn `<label>` bọc `<Button>` thì lồng một `<button>` vào label, thứ
 * screen reader đọc thành hai control.
 */
export function ImageUploadButton({
  onUploaded,
  label,
  disabled = false,
}: {
  onUploaded: (asset: MediaAsset) => void;
  /** Bỏ trống thì dùng nhãn chung "Tải ảnh lên". */
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
          // Reset để chọn LẠI đúng file vừa rồi vẫn bắn `change` (sau một lần
          // upload hỏng, đây là thao tác tự nhiên nhất của người dùng).
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
 * Ba họ lỗi, ba cách nói — trộn chúng thành "Tải lên thất bại" là lấy mất đúng
 * phần thông tin giúp người dùng biết phải làm gì tiếp.
 *
 * 1. `MessageError`: file bị chính FE từ chối trước khi gọi API (sai định dạng,
 *    quá nặng) — nó mang sẵn khoá i18n, `messageOf` lấy ra.
 * 2. `StorageUploadError`: nhịp 2, tức MinIO. Không có mã lỗi nào trong contract.
 * 3. `ApiError`: nhịp 1 hoặc 3.
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
        // Backend trả kèm allowlist và con số thật trong `message`.
        return error.message;
      default:
        return error.message || { key: "admin.posts.upload.failed" };
    }
  }

  return messageOf(error);
}
