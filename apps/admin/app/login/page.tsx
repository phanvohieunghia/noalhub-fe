import { IntlProvider } from "@noalhub/i18n/provider";
import { Suspense } from "react";

import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <IntlProvider namespace="admin.login">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Form đọc `?next` bằng `useSearchParams()` → bắt buộc có Suspense
              boundary, nếu không cả route bị ép sang client render lúc build. */}
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
    </IntlProvider>
  );
}
