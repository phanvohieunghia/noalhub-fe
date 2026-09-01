"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthStore, useMe } from "@noalhub/api/auth";
import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { DropdownMenu } from "@noalhub/ui/dropdown-menu";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";
import { Typography } from "@noalhub/ui/typography";

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

  const user = me.data;
  const name = user?.displayName || user?.username || "";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
      <AdminBreadcrumb />
      <div className="flex items-center gap-3">
        <DropdownMenu
          className="w-64"
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              shape="circle"
              aria-label="Tài khoản"
              className="size-8 hover:bg-transparent hover:opacity-80"
            >
              <Avatar name={name} src={user?.avatarUrl} size="sm" />
            </Button>
          }
        >
          <div className="flex items-center gap-3">
            <Avatar name={name} src={user?.avatarUrl} size="md" />
            <div className="min-w-0">
              <Typography variant="title-4" className="truncate">
                {name || "—"}
              </Typography>
              <Typography variant="body-4" className="truncate opacity-70">
                {user?.email}
              </Typography>
            </div>
          </div>
          <Typography variant="body-4" className="mt-2 opacity-70">
            Vai trò: {user?.role}
          </Typography>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Typography variant="body-4" className="opacity-70">
              Giao diện
            </Typography>
            <ThemeToggle />
          </div>

          <Button variant="outline" onClick={onLogout} disabled={pending} className="mt-3 w-full">
            {pending ? "Đang đăng xuất…" : "Đăng xuất"}
          </Button>
        </DropdownMenu>
      </div>
    </header>
  );
}
