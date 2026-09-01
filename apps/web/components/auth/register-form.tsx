"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OAuthButtons } from "./oauth-buttons";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { DEFAULT_REDIRECT } from "@noalhub/core/auth/redirect";
import { registerSchema, type RegisterInput } from "@noalhub/api/auth";
import { useRegister } from "@noalhub/api/auth";
import { Typography } from "@noalhub/ui/typography";

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
      setFormError(applyApiError(error, setError, ["email", "password", "displayName"]));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Typography variant="h3" as="h1">
          Tạo tài khoản
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          Chỉ mất chưa tới một phút.
        </Typography>
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

      <Typography variant="body-3" className="text-center opacity-70">
        Đã có tài khoản?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Đăng nhập
        </Link>
      </Typography>
    </div>
  );
}
