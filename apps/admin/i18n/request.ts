import { adminRequestConfig } from "@noalhub/i18n/request";
import { getRequestConfig } from "next-intl/server";

/**
 * Admin không có segment `[locale]` (`docs/i18n-plan.md` §3.2) nên bỏ qua
 * `requestLocale` — locale lấy từ cookie `NOALHUB_LOCALE`.
 */
export default getRequestConfig(() => adminRequestConfig());
