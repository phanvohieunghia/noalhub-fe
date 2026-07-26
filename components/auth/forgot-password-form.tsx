"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/services/auth/hooks";
import { applyApiError } from "@/lib/forms/apply-api-error";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/services/auth/schemas";

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
        <h1 className="text-2xl font-semibold">Quên mật khẩu</h1>
        <p className="text-sm opacity-70">
          Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>
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

      <p className="text-center text-sm opacity-70">
        <Link href="/login" className="underline underline-offset-4">
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
