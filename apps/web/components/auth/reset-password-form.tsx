"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@noalhub/ui/button";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { useResetPassword } from "@noalhub/api/auth";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Typography } from "@noalhub/ui/typography";
import { resetPasswordSchema, type ResetPasswordInput } from "@noalhub/api/auth";

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
        <Typography variant="h3" as="h1">
          Liên kết không hợp lệ
        </Typography>
        <FormError message="Liên kết đặt lại mật khẩu thiếu mã xác thực hoặc đã hỏng." />
        <Link href="/forgot-password" className="text-body-3 underline underline-offset-4">
          Gửi lại liên kết
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Typography variant="h3" as="h1">
          Đặt lại mật khẩu
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          Chọn mật khẩu mới cho tài khoản.
        </Typography>
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
