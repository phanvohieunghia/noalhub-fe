import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
