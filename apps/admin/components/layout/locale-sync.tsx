"use client";

import { LocaleSync } from "@noalhub/ui/auth/locale-sync";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Xem `LocaleSync`. Admin không có locale trên URL nên chỉ cần render lại. */
export function AdminLocaleSync() {
  const router = useRouter();
  const onMismatch = useCallback(() => router.refresh(), [router]);

  return <LocaleSync onMismatch={onMismatch} />;
}
