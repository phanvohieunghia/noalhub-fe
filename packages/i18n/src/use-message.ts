"use client";

import { isMessage, type Message } from "@noalhub/api/message";
import { useTranslations } from "next-intl";

/**
 * Dịch những thông điệp **do tầng dữ liệu sinh ra**, không phải do component
 * viết: message của zod trong các file `schemas.ts` của `@noalhub/api`, và
 * kết quả của các hàm `ErrorText` trong `packages/core`.
 *
 * Vì sao chúng là khoá chứ không phải câu: schema và hàm map lỗi chạy ở module
 * scope, nạp một lần lúc import, không biết locale của request nào
 * (`docs/i18n-plan.md` §7.3). Nên chúng nói `"validation.email.invalid"`, còn
 * việc dịch xảy ra ở đây — đúng lúc render, đúng locale.
 *
 * Chuỗi không khớp khoá nào đi thẳng qua: đó là câu do **backend** soạn, không
 * có bản dịch, hiện nguyên văn (§7.3 chấp nhận điều này ở đợt này).
 */
export function useMessage() {
  const t = useTranslations();

  return (message?: Message | string | null): string | undefined => {
    if (!message) return undefined;
    const key = isMessage(message) ? message.key : message;
    const values = isMessage(message) ? message.values : undefined;

    /*
     * Ép kiểu là bắt buộc và chỉ ở đúng chỗ này: khoá đến từ runtime (schema
     * zod, hàm map lỗi), nên kiểu khoá tĩnh của next-intl không kiểm được. Đổi
     * lại `has()` kiểm ngay trước khi dịch, nên khoá sai ra chuỗi khoá chứ
     * không ném lỗi.
     */
    const translate = t as unknown as {
      (key: string, values?: Record<string, string | number>): string;
      has: (key: string) => boolean;
    };

    return translate.has(key) ? translate(key, values) : key;
  };
}
