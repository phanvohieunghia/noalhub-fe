"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useMe, type UserRole } from "@noalhub/api/auth";

import { Button } from "../button";

/**
 * Lớp thứ hai sau `AuthGuard`: đã đăng nhập **và** đúng role.
 *
 * Vì sao cần: `AuthGuard` chỉ kiểm `status === "authenticated"`, nghĩa là mọi
 * user thường đăng nhập được vào `/dashboard` của admin. Backend vẫn trả 403 nên
 * không lộ dữ liệu, nhưng UI cho vào là sai và đẻ ra một màn hình toàn lỗi.
 *
 * Đặt ở `packages/ui` chứ không ở `apps/admin` vì đây là vỏ session dùng chung,
 * không phải feature của admin — `apps/web` sau này cũng có thể cần chặn theo role.
 *
 * Guard này là **UX, không phải bảo mật**: role đọc từ `/auth/me` ở client, ai
 * cũng sửa được trong devtools. Ranh giới thật vẫn là 403 của backend.
 */
export function RoleGuard({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const me = useMe();
  const router = useRouter();

  const isDenied = me.isSuccess && me.data.role !== role;

  useEffect(() => {
    // Không auto-redirect. Đá thẳng ra `/login` khi user ĐANG có phiên hợp lệ
    // là vòng lặp: login xong lại vào đây, lại bị đá ra, không ai đọc kịp lý do.
    // Màn hình dưới nói rõ lý do và để user tự chọn đăng xuất.
    if (isDenied) {
      router.prefetch("/login");
    }
  }, [isDenied, router]);

  if (me.isPending) return <RoleSkeleton />;

  // Lỗi tải `/auth/me` (mạng, 5xx) khác hẳn với sai role — đừng gộp thành
  // "không có quyền", user sẽ đi tìm nhầm nguyên nhân.
  if (me.isError) {
    return (
      <GuardScreen
        title="Không tải được phiên đăng nhập"
        message="Thử tải lại trang. Nếu vẫn lỗi thì backend đang không phản hồi."
      />
    );
  }

  if (isDenied) {
    return (
      <GuardScreen
        title="Bạn không có quyền truy cập"
        message={`Khu vực này chỉ dành cho tài khoản ${role}. Tài khoản đang đăng nhập là ${me.data.email}.`}
        action={
          <Button onClick={() => router.replace("/login")}>
            Đăng nhập bằng tài khoản khác
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}

function GuardScreen({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <main
      role="alert"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm opacity-70">{message}</p>
      {action}
    </main>
  );
}

function RoleSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-3xl animate-pulse space-y-4 p-8"
      aria-busy="true"
    >
      <div className="h-8 w-48 rounded bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
    </div>
  );
}
