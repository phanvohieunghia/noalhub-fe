"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@noalhub/ui/button";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { useForgotPassword } from "@noalhub/api/auth";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Typography } from "@noalhub/ui/typography";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@noalhub/api/auth";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await forgotPassword.mutateAsync(values);
      setSent(true);
    } catch (error) {
      setFormError(applyApiError(error, setError, ["email"]));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Typography variant="h3" as="h1">
          Quên mật khẩu
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </Typography>
      </header>

      {sent ? (
        // Không tiết lộ email có tồn tại hay không — tránh dò tài khoản.
        <FormSuccess message="Nếu email tồn tại trong hệ thống, liên kết đặt lại đã được gửi. Vui lòng kiểm tra hộp thư." />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={formError} />

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi…" : "Gửi liên kết"}
          </Button>
        </form>
      )}

      <Typography variant="body-3" className="text-center opacity-70">
        <Link href="/login" className="underline underline-offset-4">
          Quay lại đăng nhập
        </Link>
      </Typography>
    </div>
  );
}
