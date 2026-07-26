"use client";

import { Button } from "@/components/ui/button";
import { rememberOAuthNext } from "@/lib/auth/redirect";
import { oauthStartUrl } from "@/services/auth/hooks";
import type { OAuthProvider } from "@/services/auth/types";

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
];

export function OAuthButtons({ next }: { next?: string }) {
  // Điều hướng ra ngoài origin → dùng window.location, không dùng <Link>.
  const go = (provider: OAuthProvider) => {
    rememberOAuthNext(next);
    window.location.assign(oauthStartUrl(provider));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide opacity-50">
        <span className="h-px flex-1 bg-current" />
        hoặc
        <span className="h-px flex-1 bg-current" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ id, label }) => (
          <Button key={id} variant="outline" onClick={() => go(id)}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
