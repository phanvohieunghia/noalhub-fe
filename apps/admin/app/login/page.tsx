import { IntlProvider } from "@noalhub/i18n/provider";
import { Suspense } from "react";

import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <IntlProvider namespace="admin.login">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* The form reads `?next` with `useSearchParams()` → a Suspense
              boundary is required, or the whole route is forced to client
              rendering at build time. */}
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
    </IntlProvider>
  );
}
