import path from "node:path";

import {
  BLOG_IMAGE_ALLOW_LOCAL_IP,
  blogImageRemotePatterns,
} from "@noalhub/config/blog-image-hosts.mjs";
import type { NextConfig } from "next";

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
  transpilePackages: ["@noalhub/api", "@noalhub/core", "@noalhub/ui"],

  /**
   * Host được phép cho ảnh trong bài viết và ảnh bìa (`docs/blog-plan.md` §6.2).
   * Host không khai ở đây làm `next/image` trả **400 ở production** trong khi
   * dev vẫn chạy — nên nó phải được chốt cùng lúc với allowlist ghi dữ liệu.
   *
   * Danh sách nằm ở `@noalhub/config/blog-image-hosts.mjs` — JS thuần, vì file
   * config này được nạp TRƯỚC khi `transpilePackages` có hiệu lực nên không
   * import được package nội bộ (chúng export TS thô). `isSafeImageSrc` trong
   * `packages/api/src/blog/schemas.ts` đọc đúng file đó, nên hai đầu không còn
   * lệch được nữa.
   */
  images: {
    remotePatterns: [...blogImageRemotePatterns],

    /**
     * Chỉ bật ngoài production — xem `BLOG_IMAGE_ALLOW_LOCAL_IP`. Không có nó
     * thì ảnh từ MinIO local (`http://localhost:9000`) bị chặn ở lớp chống SSRF
     * chứ không phải ở allowlist, và lỗi trả về trông y hệt lỗi allowlist.
     */
    dangerouslyAllowLocalIP: BLOG_IMAGE_ALLOW_LOCAL_IP,

    /**
     * `next/image` TỪ CHỐI mọi SVG khi cờ này tắt — mà media của backend cho
     * phép `image/svg+xml`, nên không bật là ảnh SVG upload lên hỏng ở đúng
     * production (dev vẫn chạy vì `next dev` không tối ưu ảnh).
     *
     * "dangerously" là thật, và nó được bù bằng ba lớp KHÁC, không phải bằng cờ
     * này (`docs/media.md` §7a bên `noalhub-be`): backend sanitize file bằng
     * DOMPurify rồi ghi đè object, nginx trả `Content-Security-Policy: sandbox`
     * cho mọi `.svg`, và host phục vụ ảnh tách hẳn khỏi origin của app.
     *
     * Lớp thứ ba là RÀNG BUỘC CỦA REPO NÀY: SVG chỉ được nhúng qua `next/image`
     * / `<img src>`. Inline nó vào DOM (`dangerouslySetInnerHTML`, import as
     * component) là cho nó chạy trên origin của app — không lớp nào ở trên cứu
     * được, vì cả ba đều dựa vào việc file được tải như một tấm ảnh.
     */
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

export default nextConfig;
