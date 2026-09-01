import { AuthGuard } from "@noalhub/ui/auth/auth-guard";
import { setRequestLocale } from "next-intl/server";

export default async function ProtectedLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthGuard>{children}</AuthGuard>;
}
