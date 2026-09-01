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
 * Backend redirect về đây kèm `?code=` — handoff code dùng MỘT lần, hết hạn
 * sau 60 giây. Token không bao giờ đi qua URL.
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

  // Lỗi từ URL là giá trị dẫn xuất — tính khi render, không setState trong effect.
  const parsed = useMemo(() => parseCallback(searchParams), [searchParams]);
  const handled = useRef(false);
  const { mutate } = exchange;

  useEffect(() => {
    if (!parsed.ok || handled.current) return;
    // Code chỉ đổi được một lần: để effect chạy lại (StrictMode) là lần thứ
    // hai nhận INVALID_TOKEN và ghi đè kết quả thành công.
    handled.current = true;

    mutate(parsed.code, {
      // replace (không phải push) để code biến khỏi lịch sử trình duyệt ngay.
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
  // Câu của backend, không có bản dịch — hiện nguyên văn (§7.3).
  if (error instanceof ApiError) return error.message;
  return { key: "web.auth.oauth.exchangeFailed" };
}
