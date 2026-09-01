import { DEFAULT_LOCALE } from "@noalhub/i18n/config";
import { IntlProvider } from "@noalhub/i18n/provider";
import { NavigationProgress } from "@noalhub/ui/navigation-progress";
import type { Metadata } from "next";

import { RootHtml, rootMetadata } from "../root-html";

/**
 * Root layout thứ hai, chỉ cho `/auth/callback`.
 *
 * Nhánh này nằm NGOÀI `[locale]` vì `redirect_uri` của OAuth đã ghim ở backend
 * và ở console của Google/GitHub — thêm tiền tố locale vào đó là hỏng đăng nhập
 * (§10). Đổi lại nó không biết locale, nên `<html lang>` lấy mặc định: đây là
 * màn hình chuyển tiếp, người dùng nhìn thấy chưa tới một giây.
 *
 * Có hai root layout thì repo **không được** có `app/layout.tsx` —
 * `docs/01-app/01-getting-started/02-project-structure.md`.
 */
export const metadata: Metadata = rootMetadata;

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootHtml lang={DEFAULT_LOCALE}>
      <IntlProvider namespace="web.auth">
        <NavigationProgress />
        {children}
      </IntlProvider>
    </RootHtml>
  );
}
