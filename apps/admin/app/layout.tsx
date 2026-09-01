import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

import "./globals.css";
import { THEME_INIT_SCRIPT } from "@noalhub/core/theme/script";
import { AuthProvider } from "@noalhub/ui/auth/auth-provider";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { ThemeProvider } from "@noalhub/ui/theme/theme-provider";

/** Xem chú thích ở `apps/web/app/layout.tsx` — hai app dùng chung một font. */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/** Bản nghiêng cho variant `caption` — xem chú thích ở `apps/web/app/layout.tsx`. */
const openSansItalic = Open_Sans({
  variable: "--font-open-sans-italic",
  subsets: ["latin", "vietnamese"],
  style: "italic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noalhub Admin",
  description: "Bảng điều khiển quản trị Noalhub",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Xem chú thích ở `apps/web/app/layout.tsx` — hai app cố ý giống hệt nhau
    // ở khối này, kể cả key localStorage.
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${openSans.variable} ${openSansItalic.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
