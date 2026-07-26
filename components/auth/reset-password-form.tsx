"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/services/auth/hooks";
import { applyApiError } from "@/lib/forms/apply-api-error";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/services/auth/schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const resetPassword = useResetPassword(token);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await resetPassword.mutateAsync(values);
      setDone(true);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (error) {
      setFormError(applyApiError(error, setError, ["newPassword", "token"]));
    }
  });

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Liên kết không hợp lệ</h1>
        <FormError message="Liên kết đặt lại mật khẩu thiếu mã xác thực hoặc đã hỏng." />
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Gửi lại liên kết
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Đặt lại mật khẩu</h1>
        <p className="text-sm opacity-70">Chọn mật khẩu mới cho tài khoản.</p>
      </header>

      {done ? (
        <FormSuccess message="Đổi mật khẩu thành công. Đang chuyển tới trang đăng nhập…" />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={formError} />

          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Input
            label="Nhập lại mật khẩu"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu…" : "Đổi mật khẩu"}
          </Button>
        </form>
      )}
    </div>
  );
}
