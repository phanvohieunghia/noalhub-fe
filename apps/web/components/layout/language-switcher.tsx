"use client";

import type { Locale } from "@noalhub/i18n/config";
import { getPathname, usePathname } from "@noalhub/i18n/navigation";
import { LanguageSwitcher } from "@noalhub/ui/language-switcher";

/**
 * `LanguageSwitcher` cho web: URL có tiền tố locale, nên đổi ngôn ngữ là **đổi
 * URL** chứ không chỉ đổi cookie (§3.1). Ghi cookie mà giữ nguyên `/vi/...` thì
 * URL thắng và trang quay lại tiếng Việt ngay lần điều hướng sau.
 *
 * `usePathname` ở đây là bản của next-intl — nó trả đường dẫn **đã bỏ** tiền tố
 * locale nhưng giữ nguyên giá trị của segment động (`/blogs/bai-viet-abc`), còn
 * `getPathname` ghép lại tiền tố mới. Người dùng đứng đâu thì ở nguyên đó.
 *
 * ⚠️ **Điều hướng CỨNG (`location.assign`), không phải `router.replace`.**
 * `<html>` và `<head>` nằm trong `app/[locale]/layout.tsx`, nên đổi locale bằng
 * soft navigation bắt React dựng lại chính khối đó ở phía client — và trong đó
 * có `<script>` chống nháy theme. React từ chối chạy `<script>` khi render ở
 * client và log lỗi "Encountered a script tag while rendering React component".
 * Tải lại cả trang thì `<html lang>` đúng ngay từ HTML server trả về (thứ
 * Googlebot đọc) và script theme chạy lại bình thường. Đổi ngôn ngữ là thao tác
 * hiếm, một lần tải lại ở đây là giá rẻ.
 */
export function WebLanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();

  const onSwitch = (locale: Locale) => {
    window.location.assign(getPathname({ href: pathname, locale }));
  };

  return <LanguageSwitcher onSwitch={onSwitch} className={className} />;
}
