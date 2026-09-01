import { IntlProvider } from "@noalhub/i18n/provider";
import { setRequestLocale } from "next-intl/server";

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.auth">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </IntlProvider>
  );
}
