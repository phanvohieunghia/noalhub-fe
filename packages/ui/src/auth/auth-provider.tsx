"use client";

import { useEffect } from "react";
import { tokenStore, useAuthStore } from "@noalhub/api/auth";

/**
 * Wraps the whole app. Restores the session on mount but renders children
 * immediately — public pages are never blocked on bootstrap.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();

    // Another tab logged out → this tab signs out too.
    return tokenStore.onExternalClear(() => {
      useAuthStore.getState().reset();
    });
  }, []);

  return <>{children}</>;
}
