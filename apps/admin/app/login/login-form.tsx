"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginSchema, useAuthStore, useLogin, type LoginInput } from "@noalhub/api/auth";
import { safeRedirect } from "@noalhub/core/auth/redirect";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { Typography } from "@noalhub/ui/typography";

/**
 * Admin dùng LẠI nguyên tầng dữ liệu của web (`useLogin`, `loginSchema`) —
 * không có bản sao contract nào ở đây. Khác biệt duy nhất là UI và việc KHÔNG
 * mở đường đăng ký / OAuth: cửa vào admin chỉ có một.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const logout = useAuthStore((s) => s.logout);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);

      // Chặn ngay tại cửa: user thường đăng nhập đúng mật khẩu vẫn là phiên hợp
      // lệ, nhưng không có việc gì trong này. `RoleGuard` cũng chặn, chỗ này chỉ
      // để họ đọc được lý do ở đúng form vừa bấm thay vì rơi vào màn hình chặn.
      if (useAuthStore.getState().user?.role !== "admin") {
        await logout();
        setFormError("Tài khoản này không có quyền quản trị.");
        return;
      }

      router.replace(safeRedirect(searchParams.get("next"), "/overview"));
    } catch (error) {
      setFormError(applyApiError(error, setError, ["email", "password"]));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Typography variant="h3" as="h1">
          Noalhub Admin
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          Khu vực quản trị.
        </Typography>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={formError} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>
    </div>
  );
}
