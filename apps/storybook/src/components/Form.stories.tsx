import type { Meta, StoryObj } from "@storybook/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@noalhub/ui/button";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";
import { Input } from "@noalhub/ui/input";
import { Typography } from "@noalhub/ui/typography";
import { useMessage } from "@noalhub/i18n/use-message";

/*
 * The schema mirrors the app convention: zod messages are translation KEYS, not
 * sentences, because schemas run at module scope with no locale (`docs/i18n.md`
 * §7.3). `useMessage()` translates them at render time, so switching the locale
 * in the toolbar also switches the error text.
 */
const schema = z
  .object({
    email: z.email({ message: "validation.email.invalid" }),
    password: z.string().min(12, { message: "validation.password.tooShort" }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.password.mismatch",
  });

type FormValues = z.infer<typeof schema>;

/** A realistic form: `react-hook-form` + `zod`, wired to the UI primitives. */
function DemoForm({ serverError }: { serverError?: string }) {
  const m = useMessage();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async () => {
    setSubmitted(true);
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-sm flex-col gap-4"
      noValidate
    >
      <Typography variant="h4" as="h2">
        Đăng ký
      </Typography>

      <FormError message={serverError} />
      {submitted ? <FormSuccess message="Gửi biểu mẫu thành công!" /> : null}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={m(errors.email?.message)}
        {...register("email")}
      />
      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        error={m(errors.password?.message)}
        {...register("password")}
      />
      <Input
        label="Nhập lại mật khẩu"
        type="password"
        autoComplete="new-password"
        error={m(errors.confirmPassword?.message)}
        {...register("confirmPassword")}
      />

      <Button type="submit" disabled={isSubmitting}>
        Gửi
      </Button>
    </form>
  );
}

const meta: Meta<typeof DemoForm> = {
  title: "UI/Forms/Form",
  component: DemoForm,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    serverError: {
      control: "text",
      description: "Lỗi cấp biểu mẫu trả về từ server (không gắn với field nào)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof DemoForm>;

/** Trạng thái mặc định — bấm "Gửi" khi để trống để xem lỗi validation. */
export const Default: Story = {};

/** Biểu mẫu kèm lỗi cấp form trả về từ backend. */
export const WithServerError: Story = {
  args: {
    serverError: "Email này đã được sử dụng.",
  },
};
