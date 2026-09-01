import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";

/*
 * ⚠️ `globals.css` phải được import ở ĐÂY, không phải ở hai file layout.
 *
 * Trước khi tách root layout, nó nằm trong `app/layout.tsx`. File đó đã bị xoá
 * (hai root layout — xem chú thích dưới), và đây là module duy nhất mà **cả
 * hai** root layout đều đi qua. Thiếu dòng này thì app vẫn build xanh và vẫn
 * render đủ HTML, chỉ là không có một dòng Tailwind nào — không lỗi ở đâu để
 * lần ra.
 */
import "./globals.css";
import { appUrl } from "@noalhub/core/blog/seo";
import { THEME_INIT_SCRIPT } from "@noalhub/core/theme/script";
import { AuthProvider } from "@noalhub/ui/auth/auth-provider";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { ThemeProvider } from "@noalhub/ui/theme/theme-provider";

/**
 * Khung `<html>` dùng chung cho **cả hai root layout** của app.
 *
 * App có hai root layout vì `<html lang>` phải nói đúng ngôn ngữ đang render mà
 * `lang` thì nằm trên `<html>`: `app/[locale]/layout.tsx` biết locale, còn
 * `app/auth/layout.tsx` (OAuth callback, cố ý nằm NGOÀI `[locale]` vì
 * `redirect_uri` đã ghim ở backend và ở console của Google/GitHub) thì không.
 * Hai root layout thì không được có `app/layout.tsx` — xem
 * `docs/01-app/01-getting-started/02-project-structure.md`.
 *
 * Font khai ở module scope, không phải trong component: `next/font/google` tải
 * file lúc build và cần một chỗ khai duy nhất cho mỗi biến thể, gọi hai lần ở
 * hai layout là hai bộ `@font-face` cho cùng một font.
 */

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
 *
 * Mô tả nằm ở `nav.json` chứ không hardcode ở đây: đây là chuỗi người dùng đọc
 * được (trong kết quả tìm kiếm), nên nó phải theo ngôn ngữ của trang. Root
 * layout nào biết locale thì tự ghi đè `description`.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Noalhub",
    template: "%s · Noalhub",
  },
};

export function RootHtml({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` là BẮT BUỘC ở đây: script dưới đây thêm class
    // `dark` vào chính thẻ này trước khi React hydrate, nên HTML của server và
    // của client lệch nhau một cách có chủ đích.
    <html
      lang={lang}
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
