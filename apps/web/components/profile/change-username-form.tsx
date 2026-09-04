"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@noalhub/ui/button";
import { ToastError, ToastSuccess } from "@noalhub/ui/toast";
import { Input } from "@noalhub/ui/input";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";
import { useChangeUsername } from "@noalhub/api/users";
import { changeUsernameSchema, type ChangeUsernameInput } from "@noalhub/api/users";
import type { User } from "@noalhub/api/users";
import { Typography } from "@noalhub/ui/typography";

/**
 * Changing the username — once every 6 months.
 *
 * The button is disabled from the backend's `nextUsernameChangeAt`; the date is
 * never computed on the frontend, because two sources of truth drift apart.
 */
export function ChangeUsernameForm({ user }: { user: User }) {
  const t = useTranslations("web.profile.username");
  const m = useMessage();
  const df = useDateFormat();
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [saved, setSaved] = useState(false);
  const changeUsername = useChangeUsername();

  const lockedUntil = user.nextUsernameChangeAt;
  const locked = lockedUntil ? new Date(lockedUntil) > new Date() : false;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangeUsernameInput>({
    resolver: zodResolver(changeUsernameSchema),
    defaultValues: { username: user.username },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSaved(false);
    try {
      await changeUsername.mutateAsync(values);
      setSaved(true);
    } catch (error) {
      // These two business errors attach to the username field, not the banner.
      if (error instanceof ApiError && error.code === ERROR_CODES.usernameTaken) {
        setError("username", { message: "web.profile.username.taken" });
        return;
      }
      if (error instanceof ApiError && error.code === ERROR_CODES.usernameChangeTooSoon) {
        setFormError({ key: "web.profile.username.tooSoon" });
        return;
      }
      setFormError(applyApiError(error, setError, ["username"]));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <ToastError message={m(formError)} />
      {saved ? <ToastSuccess message={t("saved")} /> : null}

      <Input
        label={t("label")}
        autoComplete="username"
        spellCheck={false}
        disabled={locked}
        error={m(errors.username?.message)}
        {...register("username")}
      />

      <Typography variant="body-3" className="opacity-70">
        {locked ? t("lockedUntil", { date: df.dateTime(lockedUntil) }) : t("hint")}
      </Typography>

      <div>
        <Button type="submit" disabled={locked || isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
