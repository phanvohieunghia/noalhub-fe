"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import * as mediaApi from "./api";
import { describeMediaRejection } from "./schemas";
import type { MediaAsset, UploadProgress } from "./types";
import { MessageError } from "../message";


/**
 * Uploads one file through all three steps, with progress and a way to cancel.
 *
 * **No query key and no invalidation at all** — deliberately. Media has no list
 * endpoint, and a freshly uploaded asset is in no cache: the only thing the
 * caller needs is the returned `url` to drop into a post. `useMutation` is used
 * purely for the familiar `isPending` / `error` / `reset`.
 *
 * `progress` is separate state rather than something in React Query: it changes
 * dozens of times per second, and React Query's cache is not the place for
 * data like that.
 */
export function useUploadMedia(options: { allow?: readonly string[] } = {}) {
  const { allow } = options;
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation<MediaAsset, Error, File>({
    mutationFn: async (file) => {
      /*
       * Checked on the client BEFORE calling presign. The backend still checks
       * independently — this is only to fail early: picking a 40MB file by
       * mistake is known at selection time, not after pushing all 40MB over the
       * network.
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
   * Cancels the step in flight. The backend's `pending` row is **not** cleaned
   * up here: there is no delete endpoint, and the backend's cleanup job removes
   * it after 24h.
   */
  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { ...mutation, progress, cancel };
}
