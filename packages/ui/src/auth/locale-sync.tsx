"use client";

import { useMe } from "@noalhub/api/auth";
import { isLocale, type Locale } from "@noalhub/i18n/config";
import { readLocaleCookie, writeLocaleCookie } from "@noalhub/i18n/cookie";
import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * Điểm **duy nhất** mà `user.language` thắng cookie (`docs/i18n-plan.md` §4.2).
 *
 * SSR không biết user là ai: token nằm trong `tokenStore` chứ không phải cookie
 * (`docs/auth.md`), nên lúc render server chỉ có cookie để dựa vào. Sau khi
 * `bootstrap()` hoặc login xong thì mới biết lựa chọn thật của tài khoản — lúc
 * đó nếu lệch thì kéo cookie và giao diện theo tài khoản.
 *
 * Hệ quả đã biết và chấp nhận (§10): đăng nhập trên máy lạ có cookie `en` trong
 * khi tài khoản là `vi` sẽ thấy giao diện đổi một nhịp ngay sau khi vào. Không
 * tránh được khi server không biết user trước lúc render.
 *
 * Đăng xuất **không** reset về `vi`: người ta vừa đọc bằng tiếng Anh xong.
 */
export function LocaleSync({ onMismatch }: { onMismatch: (locale: Locale) => void }) {
  const me = useMe();
  const active = useLocale();
  const language = me.data?.language;

  useEffect(() => {
    if (!language || !isLocale(language)) return;
    if (language === active && readLocaleCookie() === language) return;

    writeLocaleCookie(language);
    if (language !== active) onMismatch(language);
  }, [language, active, onMismatch]);

  return null;
}
