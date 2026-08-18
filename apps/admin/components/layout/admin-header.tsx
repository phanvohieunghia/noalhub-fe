"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthStore, useMe } from "@noalhub/api/auth";
import { Button } from "@noalhub/ui/button";

import { AdminBreadcrumb } from "./admin-breadcrumb";

export function AdminHeader() {
  const me = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const [pending, setPending] = useState(false);

  const onLogout = async () => {
    setPending(true);
    await logout();
    // Cache là dữ liệu của MỘT user — không xoá thì admin kế tiếp đăng nhập
    // trên cùng tab thấy bảng user cũ trong một nhịp.
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-3 dark:border-white/15">
      <AdminBreadcrumb />
      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-70">{me.data?.email}</span>
        <Button variant="outline" onClick={onLogout} disabled={pending}>
          {pending ? "Đang đăng xuất…" : "Đăng xuất"}
        </Button>
      </div>
    </header>
  );
}
