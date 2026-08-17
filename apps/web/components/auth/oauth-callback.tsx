"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { FormError } from "@noalhub/ui/form-error";
import { useOAuthExchange } from "@noalhub/api/auth";
import { takeOAuthNext } from "@noalhub/core/auth/redirect";
import { ApiError } from "@noalhub/api/errors";

type CallbackParams = { ok: true; code: string } | { ok: false; error: string };

/**
 * Backend redirect về đây kèm `?code=` — handoff code dùng MỘT lần, hết hạn
 * sau 60 giây. Token không bao giờ đi qua URL.
 */
function parseCallback(params: URLSearchParams): CallbackParams {
  const oauthError = params.get("error");
  if (oauthError) {
    return {
      ok: false,
      error: `Đăng nhập bằng mạng xã hội thất bại (${oauthError}).`,
    };
  }

  const code = params.get("code");
  if (!code) {
    return { ok: false, error: "Liên kết callback thiếu mã đăng nhập." };
  }

  return { ok: true, code };
}

export function OAuthCallback() {
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

  const error = parsed.ok ? exchangeErrorMessage(exchange.error) : parsed.error;

  if (error) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <FormError message={error} />
        <Link href="/login" className="text-sm underline underline-offset-4">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return <p className="text-sm opacity-70">Đang hoàn tất đăng nhập…</p>;
}

function exchangeErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  return "Không hoàn tất được đăng nhập.";
}
