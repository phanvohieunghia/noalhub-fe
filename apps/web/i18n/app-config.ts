/**
 * Bật kiểu cho khoá message trong app này.
 *
 * Import "trống" là có chủ ý: `@noalhub/i18n/app-config` khai `declare module
 * "next-intl"`, mà augmentation chỉ có hiệu lực khi file chứa nó nằm trong đồ
 * thị import của project. Xoá dòng này là mọi `t("khoa.sai")` lại biên dịch
 * được (`docs/i18n-plan.md` §9).
 */
import "@noalhub/i18n/app-config";
