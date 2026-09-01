"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OAuthButtons } from "./oauth-buttons";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { safeRedirect } from "@noalhub/core/auth/redirect";
import { loginSchema, type LoginInput } from "@noalhub/api/auth";
import { useLogin } from "@noalhub/api/auth";
import { Typography } from "@noalhub/ui/typography";

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
        <Typography variant="h3" as="h1">
          Đăng nhập
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          Chào mừng quay lại.
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

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-body-3 underline underline-offset-4">
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      <OAuthButtons next={next} />

      <Typography variant="body-3" className="text-center opacity-70">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="underline underline-offset-4">
          Đăng ký
        </Link>
      </Typography>
    </div>
  );
}
