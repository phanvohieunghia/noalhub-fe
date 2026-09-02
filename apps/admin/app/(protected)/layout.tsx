import { AuthGuard } from "@noalhub/ui/auth/auth-guard";
import { RoleGuard } from "@noalhub/ui/auth/role-guard";

import { AdminHeader } from "../../components/layout/admin-header";
import { AdminSidebar } from "../../components/layout/admin-sidebar";

/**
 * Two layers stacked, not substituted: `AuthGuard` answers "is there a
 * session?", `RoleGuard` answers "is that session an admin?". Drop the second
 * and any ordinary user can sign in here (`docs/admin-plan.md` §1).
 *
 * Both are UX only — the real boundary is still the backend's 403.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard role="admin">
        <div className="flex min-h-full flex-1">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminHeader />
            {children}
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
