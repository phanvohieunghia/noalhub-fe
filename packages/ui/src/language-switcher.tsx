"use client";

import { useChangeLanguage, type UserLanguage } from "@noalhub/api/users";
import { LOCALES, type Locale } from "@noalhub/i18n/config";
import { writeLocaleCookie } from "@noalhub/i18n/cookie";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "./button";

/**
 * Đổi ngôn ngữ giao diện. Dùng chung cho web và admin; phần khác nhau giữa hai
 * app — điều hướng sau khi đổi — đi vào prop `onSwitch`, vì web có tiền tố
 * locale trong URL còn admin thì không (`docs/i18n-plan.md` §3).
 *
 * Thứ tự thao tác là có chủ ý và **không** được đảo (§4.2):
 * 1. Ghi cookie, để lần render tiếp theo ở server đã đúng ngôn ngữ.
 * 2. Gọi `PATCH /users/me/language` để lựa chọn theo tài khoản sang máy khác.
 * 3. Điều hướng.
 *
 * ⚠️ Bước 3 **phải đợi** bước 2, nhưng chỉ trong một hạn ngắn. Ở web, điều
 * hướng là `location.assign` — tức là unload cả tài liệu, và request XHR đang
 * bay bị trình duyệt huỷ. Bắn rồi đi ngay là mất lựa chọn: cookie nói `en`, tài
 * khoản vẫn `vi`, và lần đăng nhập sau `LocaleSync` kéo ngược về `vi` — người
 * dùng thấy đúng cái mình vừa đổi bị hoàn tác.
 *
 * Ngược lại, đợi **không giới hạn** thì mạng chậm là nút đơ vô thời hạn, còn
 * khách chưa đăng nhập luôn phải chờ đủ một vòng 401. Nên: đợi tối đa
 * `PERSIST_GRACE_MS`, hết hạn thì cứ đi — cookie đã ghi rồi nên giao diện vẫn
 * đúng, chỉ là lần này không kịp lưu vào tài khoản.
 *
 * Namespace `nav` — một trong ba namespace mọi trang đều nạp. Component ở
 * `packages/ui` không được dùng namespace của riêng một app (§6).
 */
/**
 * Hạn đợi API trước khi điều hướng. Đủ rộng cho một request thật (cục bộ ~20ms,
 * qua mạng ~200ms), đủ hẹp để không ai kịp thấy nút bị treo.
 */
const PERSIST_GRACE_MS = 600;

export function LanguageSwitcher({
  onSwitch,
  className = "",
}: {
  onSwitch: (locale: Locale) => void;
  className?: string;
}) {
  const t = useTranslations("nav.languageSwitcher");
  const active = useLocale();
  const changeLanguage = useChangeLanguage();

  const switchTo = async (locale: Locale) => {
    if (locale === active || changeLanguage.isPending) return;

    writeLocaleCookie(locale);

    // Chưa đăng nhập thì 401 — cookie đã đủ, và đó là toàn bộ những gì lưu được
    // cho khách. Nuốt lỗi ở đây, không có gì để người dùng làm với nó.
    await Promise.race([
      changeLanguage.mutateAsync({ language: locale as UserLanguage }).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, PERSIST_GRACE_MS)),
    ]);

    onSwitch(locale);
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`inline-flex items-center gap-0.5 rounded-full border border-border p-0.5 ${className}`}
    >
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant={locale === active ? "primary" : "ghost"}
          size="sm"
          shape="circle"
          onClick={() => void switchTo(locale)}
          aria-pressed={locale === active}
          // Vài trăm mili giây chờ lưu là có thật — nút phải nói ra, nếu không
          // người dùng bấm tiếp lần hai.
          disabled={changeLanguage.isPending}
          aria-busy={changeLanguage.isPending}
          // `whitespace-nowrap`: nhãn dài nhất ("Tiếng Việt") bị xuống hai dòng
          // trong dropdown tài khoản của admin, vốn chỉ rộng 16rem.
          className="px-3 whitespace-nowrap"
        >
          {t(locale)}
        </Button>
      ))}
    </div>
  );
}
