import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Bản thay thế cho `next/link`, `next/navigation` trong **`apps/web`**: chúng tự
 * gắn tiền tố locale hiện tại vào mọi đường dẫn.
 *
 * `import Link from "next/link"` trong web sẽ trỏ tới URL không có tiền tố, và
 * proxy phải redirect thêm một nhịp — mất scroll position, và với `redirect()`
 * ở server thì rơi hẳn về `vi` (`docs/i18n-plan.md` §10).
 *
 * `apps/admin` thì ngược lại: dùng `next/link` như bình thường, vì URL của admin
 * không có locale.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
