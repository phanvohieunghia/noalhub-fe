"use client";

import { LocaleSync } from "@noalhub/ui/auth/locale-sync";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** See `LocaleSync`. Admin URLs carry no locale, so a re-render is enough. */
export function AdminLocaleSync() {
  const router = useRouter();
  const onMismatch = useCallback(() => router.refresh(), [router]);

  return <LocaleSync onMismatch={onMismatch} />;
}
