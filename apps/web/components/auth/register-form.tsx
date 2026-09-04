"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@noalhub/i18n/navigation";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { OAuthButtons } from "./oauth-buttons";
import { Button } from "@noalhub/ui/button";
import { ToastError } from "@noalhub/ui/toast";
import { Input } from "@noalhub/ui/input";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { DEFAULT_REDIRECT } from "@noalhub/core/auth/redirect";
import type { Message } from "@noalhub/api/message";
import { registerSchema, type RegisterInput } from "@noalhub/api/auth";
import { useRegister } from "@noalhub/api/auth";
import { Typography } from "@noalhub/ui/typography";

export function RegisterForm() {
  const t = useTranslations("web.auth.register");
  const m = useMessage();
  const router = useRouter();
  const registerUser = useRegister();

  const [formError, setFormError] = useState<Message | string | null>(null);
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
          {t("title")}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("subtitle")}
        </Typography>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <ToastError message={m(formError)} />

        <Input
          label={t("displayName")}
          autoComplete="name"
          error={m(errors.displayName?.message)}
          {...register("displayName")}
        />
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
          autoComplete="new-password"
          error={m(errors.password?.message)}
          {...register("password")}
        />
        <Input
          label={t("confirmPassword")}
          type="password"
          autoComplete="new-password"
          error={m(errors.confirmPassword?.message)}
          {...register("confirmPassword")}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <OAuthButtons />

      <Typography variant="body-3" className="text-center opacity-70">
        {t("hasAccount")}{" "}
        <Link href="/login" className="underline underline-offset-4">
          {t("login")}
        </Link>
      </Typography>
    </div>
  );
}
