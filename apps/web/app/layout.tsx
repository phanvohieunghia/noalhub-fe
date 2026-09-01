import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { appUrl } from "@noalhub/core/blog/seo";
import { AuthProvider } from "@noalhub/ui/auth/auth-provider";
import { QueryProvider } from "@noalhub/ui/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * ⚠️ `metadataBase` là BẮT BUỘC từ khi có blog: mọi URL tương đối trong
 * `alternates.canonical` và `openGraph.images` được Next nở ra thành URL tuyệt
 * đối dựa vào nó. Thiếu → build lỗi ở route nào dùng URL tương đối
 * (`docs/blog-plan.md` §6.1).
 *
 * `appUrl()` đọc `NEXT_PUBLIC_APP_URL`, biến bị **inline lúc build** — nên nó
 * phải có trong khối `env:` của `.github/workflows/publish.yml` và trong
 * `build-args` của `apps/web/Dockerfile`, không phải trong `.env` trên VPS.
 *
 * `title.template` chỉ áp cho route CON; `title.default` là tiêu đề khi route
 * không tự khai — không gộp hai thứ này thành một chuỗi.
 */
export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Noalhub",
    template: "%s · Noalhub",
  },
  description:
    "Noalhub — nhắn tin, kết bạn và những bài viết về sản phẩm, kỹ thuật của chúng tôi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
