"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import * as mediaApi from "./api";
import { describeMediaRejection } from "./schemas";
import type { MediaAsset, UploadProgress } from "./types";
import { MessageError } from "../message";


/**
 * Upload một file qua đủ ba nhịp, kèm tiến độ và một đường huỷ.
 *
 * **Không có query key và không invalidate gì cả** — cố ý. Media không có
 * endpoint liệt kê, và asset vừa upload không nằm trong cache nào: thứ duy nhất
 * gọi bên gọi cần là `url` trả về để nhét vào bài viết. Dùng `useMutation` chỉ
 * để có sẵn `isPending` / `error` / `reset` quen thuộc.
 *
 * `progress` là state riêng chứ không nhét vào React Query: nó đổi hàng chục
 * lần mỗi giây, mà cache của React Query không phải chỗ cho dữ liệu như vậy.
 */
export function useUploadMedia(options: { allow?: readonly string[] } = {}) {
  const { allow } = options;
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation<MediaAsset, Error, File>({
    mutationFn: async (file) => {
      /*
       * Kiểm ở client TRƯỚC khi gọi presign. Backend vẫn kiểm độc lập — đây chỉ
       * để hỏng sớm: chọn nhầm file 40MB thì biết ngay lúc chọn, thay vì sau khi
       * đã đẩy hết 40MB lên mạng.
       */
      const rejection = describeMediaRejection(file, { allow });
      if (rejection) throw new MessageError(rejection);

      const controller = new AbortController();
      abortRef.current = controller;
      setProgress({ loaded: 0, total: file.size, ratio: 0 });

      try {
        return await mediaApi.uploadMedia({
          file,
          onProgress: setProgress,
          signal: controller.signal,
        });
      } finally {
        abortRef.current = null;
      }
    },
    onSettled: () => setProgress(null),
  });

  /**
   * Huỷ nhịp đang chạy. Row `pending` bên backend **không** được dọn từ đây:
   * không có endpoint xoá, và job dọn của backend xoá nó sau 24h.
   */
  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { ...mutation, progress, cancel };
}
