import { webRequestConfig } from "@noalhub/i18n/request";
import { getRequestConfig } from "next-intl/server";

/**
 * Đường vào của next-intl cho mỗi request. Vị trí file là quy ước của
 * `createNextIntlPlugin` trong `next.config.ts` — đổi chỗ thì phải khai đường
 * dẫn mới ở đó.
 *
 * Phần thân nằm ở `@noalhub/i18n` vì admin cũng cần đúng logic nạp message,
 * chỉ khác cách tìm ra locale.
 */
export default getRequestConfig(({ requestLocale }) => webRequestConfig(requestLocale));
