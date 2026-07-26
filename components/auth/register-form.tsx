"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OAuthButtons } from "./oauth-buttons";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { applyApiError } from "@/lib/forms/apply-api-error";
import { DEFAULT_REDIRECT } from "@/lib/auth/redirect";
import { registerSchema, type RegisterInput } from "@/services/auth/schemas";
import { useRegister } from "@/services/auth/hooks";

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useRegister();

  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerUser.mutateAsync(values);
      router.replace(DEFAULT_REDIRECT);
    } catch (error) {
      setFormError(
        applyApiError(error, setError, ["email", "password", "displayName"]),
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Tạo tài khoản</h1>
        <p className="text-sm opacity-70">Chỉ mất chưa tới một phút.</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={formError} />

        <Input
          label="Họ tên"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo tài khoản…" : "Đăng ký"}
        </Button>
      </form>

      <OAuthButtons />

      <p className="text-center text-sm opacity-70">
        Đã có tài khoản?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
