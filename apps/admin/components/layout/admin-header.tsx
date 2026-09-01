"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuthStore, useMe } from "@noalhub/api/auth";
import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";

import { AdminBreadcrumb } from "./admin-breadcrumb";

export function AdminHeader() {
  const me = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click ra ngoài / Esc đóng popover. Dùng "mousedown" thay vì "click" để
  // popover đóng trước khi phần tử bên dưới nhận sự kiện.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
    <header className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-3 dark:border-white/15">
      <AdminBreadcrumb />
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Tài khoản"
          className="flex items-center rounded-full ring-offset-2 transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:outline-none dark:focus-visible:ring-white/40"
        >
          <Avatar name={name} src={user?.avatarUrl} size="sm" />
        </button>

        {open ? (
          <div
            role="dialog"
            aria-label="Thông tin tài khoản"
            className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-black/10 bg-white p-3 shadow-lg dark:border-white/15 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
              <Avatar name={name} src={user?.avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name || "—"}</p>
                <p className="truncate text-xs opacity-70">{user?.email}</p>
              </div>
            </div>
            <p className="mt-2 text-xs opacity-70">Vai trò: {user?.role}</p>
            <Button
              variant="outline"
              onClick={onLogout}
              disabled={pending}
              className="mt-3 w-full"
            >
              {pending ? "Đang đăng xuất…" : "Đăng xuất"}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
