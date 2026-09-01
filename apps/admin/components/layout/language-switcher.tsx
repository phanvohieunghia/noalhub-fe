"use client";

import { LanguageSwitcher } from "@noalhub/ui/language-switcher";
import { useRouter } from "next/navigation";

/**
 * `LanguageSwitcher` cho admin: URL không có locale (§3.2), nên chỉ cần ghi
 * cookie rồi bảo Next render lại từ server bằng cookie mới.
 *
 * `router.refresh()` chứ không `location.reload()`: giữ nguyên state của client
 * (bộ lọc đang chọn, nội dung đang soạn trong editor), chỉ lấy lại phần server
 * render — mà phần server chính là chỗ chứa message.
 */
export function AdminLanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();

  return <LanguageSwitcher onSwitch={() => router.refresh()} className={className} />;
}
