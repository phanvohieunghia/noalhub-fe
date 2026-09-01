import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";
import { appUrl } from "@noalhub/core/blog/seo";
import { THEME_INIT_SCRIPT } from "@noalhub/core/theme/script";
import { AuthProvider } from "@noalhub/ui/auth/auth-provider";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { ThemeProvider } from "@noalhub/ui/theme/theme-provider";

/**
 * `next/font/google` tải file font **lúc build** rồi tự host cùng static
 * assets — trình duyệt của người dùng không gọi sang Google, và không có FOUT
 * vì Next chèn sẵn `@font-face` + preload.
 *
 * `subsets` BẮT BUỘC có `vietnamese`: thiếu nó thì chữ có dấu rơi sang font
 * fallback của hệ điều hành, cùng một dòng có hai kiểu chữ khác nhau.
 *
 * Open Sans là font biến thiên (300–800) nên không khai `weight` — mọi độ đậm
 * đều nằm trong một file, và `typography.tsx` chỉ dùng 400/500/600.
 */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/**
 * Bản NGHIÊNG phải nạp riêng. `next/font/google` không nhận mảng `style` cho
 * font biến thiên, và không có nó thì trình duyệt **tự bóp nghiêng** chữ đứng
 * (synthetic oblique) — nét dày mỏng sai hẳn so với bản italic thật của Open
 * Sans, thấy rõ nhất ở `a`, `e`, `g`.
 *
 * Hai lần gọi cùng sinh ra `font-family: "Open Sans"`, chỉ khác `font-style`,
 * nên utility `italic` tự chọn đúng bản — không cần khai gì thêm ở chỗ dùng.
 * Biến `--font-open-sans-italic` không ai đọc, nhưng phải gắn `.variable` lên
 * `<html>` thì Next mới giữ lại `@font-face` này.
 */
const openSansItalic = Open_Sans({
  variable: "--font-open-sans-italic",
  subsets: ["latin", "vietnamese"],
  style: "italic",
  display: "swap",
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
    // `suppressHydrationWarning` là BẮT BUỘC ở đây: script dưới đây thêm class
    // `dark` vào chính thẻ này trước khi React hydrate, nên HTML của server và
    // của client lệch nhau một cách có chủ đích.
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${openSans.variable} ${openSansItalic.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Đồng bộ, không `defer`/`async`, và phải nằm trước mọi thứ khác —
            nó chạy trước lần paint đầu để trang không nháy trắng rồi mới tối.
            Nội dung là hằng số của repo, không có dữ liệu người dùng. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
