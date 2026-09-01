"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

/**
 * Chặn rời trang khi còn thay đổi chưa lưu.
 *
 * **Bắt buộc, không phải tuỳ chọn** (`docs/blog-plan.md` §7.3): editor cố ý
 * không autosave, nên đây là lưới an toàn DUY NHẤT thay cho nó.
 *
 * Hai đường ra khỏi trang, hai cách chặn:
 *
 * 1. **Đóng tab / F5 / gõ URL khác** — `beforeunload`. Trình duyệt hiện hộp
 *    thoại của chính nó; nội dung câu chữ không đổi được, chỉ bật/tắt được.
 * 2. **Bấm link trong app** — bắt click ở **capture phase** trên `document`,
 *    trước khi router của Next kịp xử lý. `preventDefault` một mình là không đủ:
 *    `<Link>` của Next điều hướng trong chính handler onClick của nó, nên phải
 *    `stopPropagation` để sự kiện không tới được đó.
 *
 * ⚠️ Nút **Back** của trình duyệt không chặn được bằng cách này. App Router
 * không có API chặn điều hướng (`useBlocker` là của React Router), và mọi cách
 * lách qua `history.pushState` đều làm hỏng lịch sử duyệt theo cách khó chữa
 * hơn nhiều so với việc mất một lần gõ dở. Ghi ra để đây là lỗ hổng CÓ Ý THỨC
 * chứ không phải bỏ sót.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const t = useTranslations("admin.posts");

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Vài trình duyệt cũ vẫn cần `returnValue` mới hiện hộp thoại.
      event.returnValue = "";
    };

    const onClickCapture = (event: MouseEvent) => {
      // Bỏ qua click phụ, và bỏ qua khi người dùng chủ ý mở tab mới — tab hiện
      // tại không đi đâu cả nên không có gì để mất.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href || anchor.target === "_blank") return;
      // Link ngoài rời khỏi app hẳn — `beforeunload` ở trên đã lo.
      if (!href.startsWith("/")) return;
      if (href === window.location.pathname) return;

      if (!window.confirm(t("unsavedChanges"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [isDirty, t]);
}
