"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@noalhub/ui/button";
import { useAuthStore } from "@noalhub/api/auth";

export function LogoutButton() {
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
    <Button variant="outline" onClick={onClick} disabled={pending}>
      {pending ? "Đang đăng xuất…" : "Đăng xuất"}
    </Button>
  );
}
