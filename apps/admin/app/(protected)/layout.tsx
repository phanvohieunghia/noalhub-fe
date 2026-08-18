import { AuthGuard } from "@noalhub/ui/auth/auth-guard";
import { RoleGuard } from "@noalhub/ui/auth/role-guard";

import { AdminHeader } from "../../components/layout/admin-header";
import { AdminSidebar } from "../../components/layout/admin-sidebar";

/**
 * Hai lớp chồng nhau, không thay thế nhau: `AuthGuard` lo "có phiên không",
 * `RoleGuard` lo "phiên đó có phải admin không". Bỏ lớp thứ hai thì mọi user
 * thường đăng nhập được vào đây (`docs/admin-plan.md` §1).
 *
 * Cả hai chỉ là UX — ranh giới thật vẫn là 403 của backend.
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
