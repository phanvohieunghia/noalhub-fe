"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@noalhub/ui/button";
import { useAuthStore } from "@noalhub/api/auth";

/**
 * ⚠️ Namespace là `nav`, KHÔNG phải `web.auth`.
 *
 * Nút này sống ở menu tài khoản của chat và ở dashboard — hai chỗ mà
 * `IntlProvider` chỉ nạp `web.chat` / `web.dashboard`. Ghim vào `web.auth` thì
 * nó ném `MISSING_MESSAGE` **lúc chạy** ở đúng hai chỗ đó, trong khi TypeScript
 * và `check-messages` đều xanh (khoá có thật, chỉ là không được gửi xuống
 * client ở route đó). `nav` là một trong ba namespace mọi trang đều nạp.
 */
export function LogoutButton({ className }: { className?: string } = {}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    await logout();
    // Cache là dữ liệu của MỘT user — không xoá thì user kế tiếp đăng nhập
    // trên cùng tab sẽ thấy dữ liệu cũ trong một nhịp.
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={pending} className={className}>
      {pending ? t("loggingOut") : t("logout")}
    </Button>
  );
}
