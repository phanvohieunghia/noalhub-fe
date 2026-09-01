"use client";

import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { rememberOAuthNext } from "@noalhub/core/auth/redirect";
import { oauthStartUrl } from "@noalhub/api/auth";
import type { OAuthProvider } from "@noalhub/api/auth";

const PROVIDERS: { id: OAuthProvider; label: string; icon: string }[] = [
  { id: "google", label: "Google", icon: ICONS.google },
  { id: "github", label: "GitHub", icon: ICONS.github },
];

export function OAuthButtons({ next }: { next?: string }) {
  // Điều hướng ra ngoài origin → dùng window.location, không dùng <Link>.
  const go = (provider: OAuthProvider) => {
    rememberOAuthNext(next);
    window.location.assign(oauthStartUrl(provider));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-body-4 flex items-center gap-3 uppercase tracking-wide opacity-50">
        <span className="h-px flex-1 bg-current" />
        hoặc
        <span className="h-px flex-1 bg-current" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ id, label, icon }) => (
          <Button key={id} variant="outline" onClick={() => go(id)}>
            <Icon icon={icon} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
