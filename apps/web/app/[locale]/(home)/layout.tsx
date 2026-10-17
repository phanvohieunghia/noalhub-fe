import { setRequestLocale } from "next-intl/server";

/**
 * The home page is **public**: signed-out visitors see it too (the header's
 * account slot swaps to "Sign in"). It sits in its own route group rather than
 * `(public)` because that group's layout adds the blog header, category nav and
 * footer, while the home page brings its own header and footer.
 */
export default async function HomeLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return children;
}
