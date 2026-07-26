"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth/store";
import { tokenStore } from "@/lib/auth/token-store";

/**
 * Bọc quanh toàn app. Khôi phục phiên lúc mount nhưng render children ngay —
 * phần public không bị chặn bởi bootstrap.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();

    // Tab khác logout → tab này cũng thoát.
    return tokenStore.onExternalClear(() => {
      useAuthStore.getState().reset();
    });
  }, []);

  return <>{children}</>;
}
