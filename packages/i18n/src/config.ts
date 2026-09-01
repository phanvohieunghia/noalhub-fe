/**
 * Hằng số i18n dùng chung cho **cả hai app**. File này không import gì từ
 * `next-intl` để nó nạp được ở mọi nơi: proxy (edge), server component, client
 * component, và cả `scripts/check-messages.mjs`.
 *
 * Xem `docs/i18n-plan.md`.
 */

export const LOCALES = ["vi", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Ngôn ngữ khi không có tín hiệu nào khác. Phải khớp `DEFAULT_USER_LANGUAGE`
 * của backend (`src/users/language.ts`) — lệch thì user mới sẽ thấy giao diện
 * một đằng còn `user.language` một nẻo ngay sau khi đăng ký.
 */
export const DEFAULT_LOCALE: Locale = "vi";

/**
 * Lớp đệm để SSR biết ngôn ngữ **trước** khi gọi `/auth/me`. Nguồn sự thật vẫn
 * là `user.language` ở backend; cookie chỉ chạy trước một nhịp.
 *
 * KHÔNG `HttpOnly`: `LanguageSwitcher` phải đọc/ghi được từ client, nếu không
 * mỗi lần đổi ngôn ngữ phải đi vòng qua server và giao diện nháy.
 */
export const LOCALE_COOKIE = "NOALHUB_LOCALE";

/** 1 năm. Ngắn hơn thì người dùng quay lại sau kỳ nghỉ là mất lựa chọn. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Chọn locale gần nhất từ `Accept-Language`. Chỉ dùng cho khách vào lần đầu —
 * ai đã có cookie hoặc đã đăng nhập thì không đi qua đây.
 *
 * So khớp theo tiền tố ngôn ngữ (`en-US` → `en`), bỏ qua `q=`: với đúng hai
 * ngôn ngữ thì thứ tự xuất hiện đã đủ, kéo cả thư viện negotiator vào edge
 * bundle chỉ để sắp xếp hai phần tử là không đáng.
 */
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    const base = tag?.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
