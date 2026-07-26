import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

// Next 16: searchParams là Promise, phải await.
export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const { token } = await props.searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
