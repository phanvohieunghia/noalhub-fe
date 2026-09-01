/**
 * Allowlist host cho ảnh trong bài viết (`docs/blog-plan.md` §6.2) — NGUỒN SỰ
 * THẬT DUY NHẤT cho cả ba nơi cần nó:
 *
 *   1. `images.remotePatterns` — `apps/web/next.config.ts`
 *   2. `images.remotePatterns` — `apps/admin/next.config.ts` (tab Xem trước)
 *   3. `isSafeImageSrc` — `packages/api/src/blog/schemas.ts` (validate lúc ghi)
 *
 * Vì sao là `.mjs` chứ không phải `.ts` trong `packages/api`: `next.config.ts`
 * được nạp TRƯỚC khi `transpilePackages` có hiệu lực, nên nó không import được
 * package nội bộ (chúng export TS thô). JS thuần thì không cần transpile, nên
 * config nạp thẳng được — và đó là toàn bộ lý do file này tồn tại.
 *
 * Đây là POLICY BẢO MẬT, không phải config vận hành: nó là lớp phòng thủ thứ
 * hai cho stored XSS qua `image.src` (xem `packages/ui/src/blog/post-content.tsx`).
 * Vì vậy nó được hardcode chứ KHÔNG đọc từ env — nới allowlist phải đi qua PR,
 * chứ không phải qua một biến môi trường sửa được lúc deploy. Thêm nữa
 * `isSafeImageSrc` chạy cả ở client (editor Tiptap), nên env cũng sẽ phải là
 * `NEXT_PUBLIC_*` và bị inline vào bundle — đổi tính bất biến lấy đúng số không.
 */

/**
 * `next build` luôn đặt `NODE_ENV=production`, nên một bản build production
 * KHÔNG BAO GIỜ mang theo host dev — kể cả khi build ngay trên máy này. Ở phía
 * client, Next inline hằng số này rồi cắt nhánh chết, nên `"localhost"` cũng
 * không lọt vào bundle production.
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Host production. Luôn `https:` — xem `isSafeImageSrc`. */
export const BLOG_IMAGE_HOSTS = [
  "images.unsplash.com",
  "img-noalhub.duckdns.org",
];

/**
 * Host chỉ dùng khi phát triển, và là ngoại lệ `http:` DUY NHẤT.
 *
 * Hẹp có chủ đích: đúng hostname `localhost` (không phải `127.0.0.1`, không
 * phải `*.localhost`), mọi port — media dev đổi port thì không phải sửa file
 * này. Bỏ trống `port` là khớp mọi port: `matchRemotePattern` chỉ so port khi
 * pattern có khai nó.
 *
 * `http:` mở ở đây an toàn CHÍNH VÌ nó gắn với `localhost`: một origin mà chỉ
 * máy của lập trình viên mới trỏ tới được, nên không có bề mặt tấn công từ xa
 * như khi mở `http:` cho một host công khai. Đừng thêm host non-localhost vào
 * danh sách này — cần host mới thì nó thuộc về `BLOG_IMAGE_HOSTS` và phải là
 * `https:`.
 */
export const BLOG_IMAGE_DEV_HOSTS = IS_PRODUCTION ? [] : ["localhost"];

/**
 * Dạng `images.remotePatterns` của Next, để hai `next.config.ts` khỏi tự map.
 *
 * Protocol ở đây phải nói cùng một câu với `isSafeImageSrc`: `https:` cho host
 * production, `http:` cho host dev. Lệch một vế là rơi lại đúng cái bug mà file
 * này sinh ra để xoá — ảnh ghi được ở editor nhưng `next/image` trả 400.
 */
/**
 * `images.dangerouslyAllowLocalIP` cho hai `next.config.ts`.
 *
 * Vì sao cần, ngoài allowlist: image optimizer của Next 16 resolve DNS của host
 * upstream rồi TỪ CHỐI mọi IP private/loopback — chống SSRF, chạy TRƯỚC cả
 * `remotePatterns`. Nên `localhost` có nằm trong allowlist thì ảnh dev vẫn hỏng,
 * và thông báo trả về client là `400 "url" parameter is not allowed`, giống hệt
 * lỗi allowlist. Sự thật chỉ nằm ở log server:
 *
 *   ⨯ upstream image http://localhost:9000/... resolved to private ip ["::1","127.0.0.1"]
 *
 * Buộc vào đúng `IS_PRODUCTION` như `BLOG_IMAGE_DEV_HOSTS`: hai thứ này phải
 * bật/tắt cùng nhau, tách ra là lại mất một buổi đi tìm.
 */
export const BLOG_IMAGE_ALLOW_LOCAL_IP = !IS_PRODUCTION;

export const blogImageRemotePatterns = [
  ...BLOG_IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
  ...BLOG_IMAGE_DEV_HOSTS.map((hostname) => ({ protocol: "http", hostname })),
];
