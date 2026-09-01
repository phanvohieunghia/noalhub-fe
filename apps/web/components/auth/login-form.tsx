"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@noalhub/i18n/navigation";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OAuthButtons } from "./oauth-buttons";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { safeRedirect } from "@noalhub/core/auth/redirect";
import type { Message } from "@noalhub/api/message";
import { loginSchema, type LoginInput } from "@noalhub/api/auth";
import { useLogin } from "@noalhub/api/auth";
import { Typography } from "@noalhub/ui/typography";

export function LoginForm() {
  const t = useTranslations("web.auth.login");
  // Message của zod và của backend là KHOÁ, dịch ở đây (`docs/i18n-plan.md` §7.3).
  const m = useMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirect(searchParams.get("next"));
  const login = useLogin();

  const [formError, setFormError] = useState<Message | string | null>(null);
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
          {t("title")}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("subtitle")}
        </Typography>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={m(formError)} />

        <Input
          label={t("email")}
          type="email"
          autoComplete="email"
          error={m(errors.email?.message)}
          {...register("email")}
        />
        <Input
          label={t("password")}
          type="password"
          autoComplete="current-password"
          error={m(errors.password?.message)}
          {...register("password")}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-body-3 underline underline-offset-4">
            {t("forgot")}
          </Link>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <OAuthButtons next={next} />

      <Typography variant="body-3" className="text-center opacity-70">
        {t("noAccount")}{" "}
        <Link href="/register" className="underline underline-offset-4">
          {t("register")}
        </Link>
      </Typography>
    </div>
  );
}
