"use client";

import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

/**
 * Thanh tiến trình mỏng cho chuyển trang.
 *
 * **Vì sao cần:** phần lớn route của repo này render theo yêu cầu (`ƒ` trong
 * output `next build`) — admin thì toàn bộ, web thì mọi trang danh sách có
 * `searchParams`. App Router giữ nguyên trang cũ trên màn hình cho tới khi RSC
 * payload mới về, nên với người dùng một cú bấm chậm trông y hệt một cú bấm
 * hỏng. Thanh này là phản hồi cho khoảng đó.
 *
 * **Vì sao không dùng `useLinkStatus`:** hook đó chỉ chạy bên trong đúng một
 * `<Link>` (nó đọc context của link cha), nên nó hợp với hiệu ứng tại chỗ trên
 * chính cái link vừa bấm, không dựng được một thanh dùng chung cho cả app.
 *
 * **Cách phát hiện:**
 * - *Bắt đầu*: bắt `click` ở capture phase trên `document` — phải là capture để
 *   chạy trước handler của `<Link>`. Lọc ra đúng những cú bấm thật sự rời khỏi
 *   URL hiện tại.
 * - *Kết thúc*: `usePathname` hoặc `useSearchParams` đổi giá trị. Đó là tín
 *   hiệu duy nhất mà App Router phát ra khi điều hướng đã xong — không có
 *   `router.events` như Pages Router.
 *
 * Điều hướng bằng code (`router.push` trong một handler) KHÔNG được bắt: chỗ
 * đó đã có trạng thái riêng (nút "Đang lưu…", "Đang đăng nhập…") và nếu bắt cả
 * bằng cách vá `history.pushState` thì phải gánh mọi hệ quả của việc vá API
 * trình duyệt, đổi lấy rất ít.
 *
 * **Đặt ở root layout, một lần cho cả app.** Bản đầu tôi gắn nó vào từng header
 * (blog, admin, chat) cho đúng chữ "dưới header" — sai: `/dashboard`,
 * `/profile`, `/friends` và mọi trang auth **không có header nào**, nên đúng
 * những trang đó lại không có phản hồi gì. Thanh `fixed` ở mép trên viewport
 * phủ được tất cả, và trên trang có header nó nằm ngay trên viền header.
 */
export function NavigationProgress({ className }: { className?: string }) {
  /*
   * `useSearchParams` bắt buộc nằm dưới một Suspense boundary, nếu không mọi
   * trang tĩnh chứa component này sẽ hỏng lúc prerender. Bọc ngay tại đây để
   * chỗ dùng không phải nhớ.
   */
  return (
    <Suspense fallback={null}>
      <ProgressBar className={className} />
    </Suspense>
  );
}

/** Trần: không bao giờ chạm 100% khi chưa xong — 100% nghĩa là đã tới nơi. */
const CEILING = 90;

/**
 * Chờ trước khi hiện. Route đã prefetch chuyển gần như tức thì; hiện thanh cho
 * những cú đó chỉ tạo ra một vệt nhấp nháy, khó chịu hơn là không có gì.
 */
const SHOW_DELAY_MS = 120;

/** Lưới an toàn: điều hướng bị huỷ (404 tải file, tab ẩn…) thì thanh vẫn tắt. */
const MAX_DURATION_MS = 15_000;

function ProgressBar({ className = "fixed inset-x-0 top-0 z-60" }: { className?: string }) {
  const t = useTranslations("common.states");
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const [value, setValue] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const tickRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setValue((current) => (current === null ? null : 100));
    // Đợi transition width chạy hết rồi mới gỡ, nếu không thanh biến mất giữa chừng.
    timers.current.push(window.setTimeout(() => setValue(null), 220));
  }, [clearTimers]);

  const start = useCallback(() => {
    if (tickRef.current !== null) return; // đang chạy rồi
    clearTimers();

    timers.current.push(
      window.setTimeout(() => {
        setValue(12);
        /*
         * Tăng chậm dần: còn cách trần bao nhiêu thì mỗi nhịp đi được một phần
         * nhỏ của khoảng đó. Nhờ vậy thanh luôn nhúc nhích (người dùng thấy
         * "đang chạy") nhưng không bao giờ về đích trước dữ liệu — đó là kiểu
         * nói dối mà người ta nhận ra ngay.
         */
        tickRef.current = window.setInterval(() => {
          setValue((current) => {
            if (current === null) return current;
            return current + (CEILING - current) * 0.12;
          });
        }, 220);
      }, SHOW_DELAY_MS),
      window.setTimeout(finish, MAX_DURATION_MS),
    );
  }, [clearTimers, finish]);

  // URL đã đổi = điều hướng xong. Bỏ qua lần chạy đầu lúc mount.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    finish();
  }, [pathname, search, finish]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isInAppNavigation(event)) return;
      start();
    };

    // Back/forward cũng là một lần điều hướng, và cũng có thể chậm.
    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  return (
    <span className={`pointer-events-none block h-[3px] overflow-hidden ${className}`}>
      <span
        aria-hidden
        /*
         * `shadow`: một cú chuyển trang nhanh chỉ cho thanh quét qua trong vài
         * trăm mili giây. Ở 3px thì vệt sáng là thứ khiến mắt kịp bắt được nó —
         * không có nó, người dùng bảo "chẳng thấy thanh nào cả".
         */
        className="block h-full rounded-r-full bg-primary shadow-[0_0_10px_2px_var(--primary)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${value ?? 0}%`,
          opacity: value === null ? 0 : 1,
        }}
      />
      {/* Thanh màu không nói gì với trình đọc màn hình; câu này mới là phần
          truyền đạt. `role="status"` để nó được đọc mà không cướp focus. */}
      {value !== null ? (
        <span role="status" className="sr-only">
          {t("loading")}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Cú bấm này có thật sự dẫn tới một trang khác **trong app** không?
 *
 * Mọi nhánh `false` dưới đây đều là một kiểu thanh-chạy-mãi-không-dừng nếu bỏ
 * sót: URL không đổi thì `usePathname` không bao giờ báo xong, còn link tải file
 * hay ra ngoài origin thì trang này không điều hướng đi đâu cả.
 */
function isInAppNavigation(event: MouseEvent): boolean {
  // Chuột giữa/phải, hoặc giữ phím để mở tab mới → tab hiện tại đứng yên.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (event.defaultPrevented) return false;

  const anchor = (event.target as HTMLElement | null)?.closest?.("a");
  const href = anchor?.getAttribute("href");
  if (!anchor || !href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Neo trong trang: không điều hướng.
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }
  /*
   * Đường dẫn có dấu chấm = route handler trả file (`/vi/blogs/rss.xml`,
   * `/sitemap.xml`). Trình duyệt tự tải, React không render lại gì, nên không
   * có tín hiệu kết thúc nào để chờ. Cùng luật với matcher của `proxy.ts`.
   */
  if (url.pathname.split("/").pop()?.includes(".")) return false;

  return true;
}
