"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginSchema, useAuthStore, useLogin, type LoginInput } from "@noalhub/api/auth";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { safeRedirect } from "@noalhub/core/auth/redirect";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { Button } from "@noalhub/ui/button";
import { FormError } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { Logo } from "@noalhub/ui/logo";
import { Typography } from "@noalhub/ui/typography";

/**
 * Admin REUSES web's data layer wholesale (`useLogin`, `loginSchema`) — there is
 * no copy of the contract here. The only differences are the UI and the absence
 * of any signup / OAuth path: admin has exactly one door.
 */
export function AdminLoginForm() {
  const t = useTranslations("admin.login");
  const m = useMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const logout = useAuthStore((s) => s.logout);
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

      // Stopped at the door: an ordinary user with the right password still has
      // a valid session, but has nothing to do in here. `RoleGuard` stops them
      // too; this exists so they read the reason on the form they just
      // submitted rather than landing on a block screen.
      if (useAuthStore.getState().user?.role !== "admin") {
        await logout();
        setFormError({ key: "admin.login.notAdmin" });
        return;
      }

      router.replace(safeRedirect(searchParams.get("next"), "/overview"));
    } catch (error) {
      setFormError(applyApiError(error, setError, ["email", "password"]));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Logo className="mb-2 size-10" />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
