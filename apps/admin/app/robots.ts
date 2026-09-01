import type { MetadataRoute } from "next";

/**
 * Admin không có gì để index — chặn toàn bộ (`docs/blog-plan.md` §6.1).
 *
 * Đây là biện pháp bổ sung chứ không phải hàng rào: ranh giới thật vẫn là
 * `AuthGuard` + `RoleGuard` + 403 của backend. robots.txt chỉ nói với crawler
 * tử tế, nó không chặn ai cả.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
