import path from "node:path";

import {
  BLOG_IMAGE_ALLOW_LOCAL_IP,
  blogImageRemotePatterns,
} from "@noalhub/config/blog-image-hosts.mjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /**
   * Docker: `standalone` cho ra `.next/standalone` — bản sao đã trace sẵn của
   * server + đúng những file `node_modules` thực sự cần, nên image runtime
   * không phải chạy `pnpm install` lần nữa.
   *
   * `outputFileTracingRoot` là BẮT BUỘC trong monorepo: mặc định Next trace từ
   * thư mục app, mà `packages/*` nằm ngoài đó và pnpm còn symlink chúng vào
   * `node_modules` — không ghim root lên gốc repo thì standalone thiếu file và
   * container chết lúc khởi động chứ không phải lúc build.
   */
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),

  /**
   * Package nội bộ được export dưới dạng TS THÔ (`./src/*.ts`), không build ra
   * `dist/`. Next phải tự compile chúng bằng SWC của app — đó là việc mà
   * `transpilePackages` bật lên. Đổi lại: sửa file trong `packages/` là HMR ăn
   * ngay, không cần chạy watch build song song.
   *
   * Thêm package mới vào `packages/` thì PHẢI khai ở đây, nếu không build sẽ
   * chết với lỗi cú pháp ngay ở dòng `import type` đầu tiên.
   */
  transpilePackages: [
    "@noalhub/api",
    "@noalhub/core",
    "@noalhub/i18n",
    "@noalhub/ui",
  ],

  /**
   * Admin cũng cần block này, dù nó không phải trang công khai: tab **Xem
   * trước** của editor render bằng ĐÚNG `@noalhub/ui/blog/post-content`, và
   * renderer đó dùng `next/image`. Không khai host ở đây thì preview trả 400
   * cho mọi ảnh — ở production, trong khi `next dev` vẫn hiện bình thường vì
   * dev không tối ưu ảnh.
   *
   * Dùng chung nguồn với `apps/web/next.config.ts` và với `isSafeImageSrc`
   * (`packages/api/src/blog/schemas.ts`): `@noalhub/config/blog-image-hosts.mjs`.
   * File đó là JS thuần vì config được nạp trước `transpilePackages`.
   *
   * `dangerouslyAllowSVG` + `contentDispositionType`: lý do đầy đủ ở
   * `apps/web/next.config.ts` — ba lớp bảo vệ nằm ngoài cờ này.
   */
  images: {
    remotePatterns: [...blogImageRemotePatterns],

    /**
     * Chỉ bật ngoài production — xem `BLOG_IMAGE_ALLOW_LOCAL_IP`. Không có nó
     * thì ảnh từ MinIO local (`http://localhost:9000`) bị chặn ở lớp chống SSRF
     * chứ không phải ở allowlist, và lỗi trả về trông y hệt lỗi allowlist.
     */
    dangerouslyAllowLocalIP: BLOG_IMAGE_ALLOW_LOCAL_IP,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  turbopack: {
    /**
     * Turbopack KHÔNG resolve file nằm ngoài root, mà root nó tự dò bằng cách
     * đi ngược lên tìm lockfile — trên máy này nó vớ phải `~/yarn.lock` và
     * chọn cả `$HOME` làm root. Ghim thẳng vào gốc repo: đủ rộng để thấy
     * `packages/*`, đủ hẹp để không watch cả home directory.
     *
     * `process.cwd()` là thư mục app vì `next build` luôn chạy từ đó (turbo
     * cũng chạy script trong đúng package).
     */
    root: path.join(process.cwd(), "..", ".."),
  },
};

/**
 * Plugin của next-intl trỏ `next-intl/config` về `./i18n/request.ts`. Không có
 * nó thì mọi `getTranslations`/`useTranslations` chạy với cấu hình rỗng và ném
 * lỗi "no messages" ngay ở trang đầu tiên.
 */
export default createNextIntlPlugin()(nextConfig);
