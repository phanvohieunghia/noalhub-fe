"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@noalhub/ui/button";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { formatDateTime } from "@noalhub/core/format-date";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import { useChangeUsername } from "@noalhub/api/users";
import { changeUsernameSchema, type ChangeUsernameInput } from "@noalhub/api/users";
import type { User } from "@noalhub/api/users";
import { Typography } from "@noalhub/ui/typography";

/**
 * Đổi username — mỗi 6 tháng một lần.
 *
 * Nút bị khoá theo `nextUsernameChangeAt` của backend; không tự cộng ngày ở
 * frontend vì hai nguồn sự thật sẽ lệch.
 */
export function ChangeUsernameForm({ user }: { user: User }) {
  const [formError, setFormError] = useState<string | null>(null);
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
      // Hai lỗi nghiệp vụ này gắn đúng vào ô username, không đẩy lên banner.
      if (error instanceof ApiError && error.code === ERROR_CODES.usernameTaken) {
        setError("username", { message: "Username này đã có người dùng" });
        return;
      }
      if (error instanceof ApiError && error.code === ERROR_CODES.usernameChangeTooSoon) {
        setFormError("Bạn vừa đổi username gần đây, chưa tới hạn đổi tiếp.");
        return;
      }
      setFormError(applyApiError(error, setError, ["username"]));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      {saved ? <FormSuccess message="Đã cập nhật username." /> : null}

      <Input
        label="Username"
        autoComplete="username"
        spellCheck={false}
        disabled={locked}
        error={errors.username?.message}
        {...register("username")}
      />

      <Typography variant="body-3" className="opacity-70">
        {locked
          ? `Chỉ đổi được mỗi 6 tháng một lần. Lần đổi tiếp theo: ${formatDateTime(lockedUntil)}.`
          : "Chỉ đổi được mỗi 6 tháng một lần — cân nhắc trước khi lưu."}
      </Typography>

      <div>
        <Button type="submit" disabled={locked || isSubmitting}>
          {isSubmitting ? "Đang lưu…" : "Lưu username"}
        </Button>
      </div>
    </form>
  );
}
