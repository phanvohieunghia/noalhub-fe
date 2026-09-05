"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("web.auth.oauth");

  // Navigating off-origin → use window.location, never <Link>.
  const go = (provider: OAuthProvider) => {
    rememberOAuthNext(next);
    window.location.assign(oauthStartUrl(provider));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* `text-muted-foreground` chứ không phải `opacity-50`: opacity trên chữ
          nhỏ cho tương phản 3.94:1, dưới ngưỡng WCAG AA 4.5:1. Token muted có
          sẵn cho đúng việc này và tự đổi theo light/dark. */}
      <div className="text-body-4 text-muted-foreground flex items-center gap-3 uppercase tracking-wide">
        <span className="h-px flex-1 bg-current" />
        {t("divider")}
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
