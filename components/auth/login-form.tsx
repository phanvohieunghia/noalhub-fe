"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OAuthButtons } from "./oauth-buttons";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { applyApiError } from "@/lib/forms/apply-api-error";
import { safeRedirect } from "@/lib/auth/redirect";
import { loginSchema, type LoginInput } from "@/services/auth/schemas";
import { useLogin } from "@/services/auth/hooks";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirect(searchParams.get("next"));
  const login = useLogin();

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
      router.replace(next);
    } catch (error) {
      setFormError(applyApiError(error, setError, ["email", "password"]));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Đăng nhập</h1>
        <p className="text-sm opacity-70">Chào mừng quay lại.</p>
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

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm underline underline-offset-4">
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      <OAuthButtons next={next} />

      <p className="text-center text-sm opacity-70">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="underline underline-offset-4">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
