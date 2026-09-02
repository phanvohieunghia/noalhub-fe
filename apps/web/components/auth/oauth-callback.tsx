"use client";

import { Link, useRouter } from "@noalhub/i18n/navigation";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { FormError } from "@noalhub/ui/form-error";
import { useOAuthExchange } from "@noalhub/api/auth";
import { takeOAuthNext } from "@noalhub/core/auth/redirect";
import { ApiError } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";
import { Typography } from "@noalhub/ui/typography";

type CallbackParams = { ok: true; code: string } | { ok: false; error: Message };

/**
 * The backend redirects here with `?code=` — a SINGLE-use handoff code that
 * expires after 60 seconds. Tokens never travel through the URL.
 */
function parseCallback(params: URLSearchParams): CallbackParams {
  const oauthError = params.get("error");
  if (oauthError) {
    return {
      ok: false,
      error: { key: "web.auth.oauth.failed", values: { reason: oauthError } },
    };
  }

  const code = params.get("code");
  if (!code) {
    return { ok: false, error: { key: "web.auth.oauth.missingCode" } };
  }

  return { ok: true, code };
}

export function OAuthCallback() {
  const t = useTranslations("web.auth.oauth");
  const m = useMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchange = useOAuthExchange();

  // The URL's error is derived state — compute it during render, never setState in an effect.
  const parsed = useMemo(() => parseCallback(searchParams), [searchParams]);
  const handled = useRef(false);
  const { mutate } = exchange;

  useEffect(() => {
    if (!parsed.ok || handled.current) return;
    // The code can only be exchanged once: letting the effect run twice
    // (StrictMode) makes the second attempt take INVALID_TOKEN and overwrite the
    // successful result.
    handled.current = true;

    mutate(parsed.code, {
      // replace (not push) so the code leaves the browser history immediately.
      onSuccess: () => router.replace(takeOAuthNext()),
    });
  }, [parsed, mutate, router]);

  const error = parsed.ok ? exchangeErrorText(exchange.error) : parsed.error;

  if (error) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <FormError message={m(error)} />
        <Link href="/login" className="text-body-3 underline underline-offset-4">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <Typography variant="body-3" className="opacity-70">
      {t("finishing")}
    </Typography>
  );
}

function exchangeErrorText(error: unknown): Message | string | null {
  if (!error) return null;
  // A backend sentence with no translation — shown verbatim (§7.3).
  if (error instanceof ApiError) return error.message;
  return { key: "web.auth.oauth.exchangeFailed" };
}
