import { setRequestLocale } from "next-intl/server";

/**
 * Answering a set: no app header or bottom nav — the attempt owns the screen
 * and brings its own back button (which asks before leaving).
 */
export default async function FocusLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
