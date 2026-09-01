"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@noalhub/i18n/navigation";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@noalhub/ui/button";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { useForgotPassword } from "@noalhub/api/auth";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Typography } from "@noalhub/ui/typography";
import type { Message } from "@noalhub/api/message";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@noalhub/api/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("web.auth.forgotPassword");
  const m = useMessage();
  const [formError, setFormError] = useState<Message | string | null>(null);
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
          {t("title")}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("subtitle")}
        </Typography>
      </header>

      {sent ? (
        // Không tiết lộ email có tồn tại hay không — tránh dò tài khoản.
        <FormSuccess message={t("sent")} />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormError message={m(formError)} />

          <Input
            label={t("email")}
            type="email"
            autoComplete="email"
            error={m(errors.email?.message)}
            {...register("email")}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      )}

      <Typography variant="body-3" className="text-center opacity-70">
        <Link href="/login" className="underline underline-offset-4">
          {t("backToLogin")}
        </Link>
      </Typography>
    </div>
  );
}
