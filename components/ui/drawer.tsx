"use client";

import { useEffect, useRef } from "react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * Panel trượt từ mép phải. Dựng trên `<dialog>` native vì lý do giống
 * `Dialog`: focus trap, `Esc` và `::backdrop` đều có sẵn ở trình duyệt.
 *
 * Khác `Dialog` ở chỗ dán vào mép phải và cao hết màn hình — nội dung dài
 * (hồ sơ, chi tiết) đọc dễ hơn trong cột hẹp so với hộp giữa màn hình.
 */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      // `mr-0 ml-auto` + `h-full` kéo panel về mép phải; `max-h-none` để ghi đè
      // giới hạn chiều cao mặc định của <dialog>.
      className="mr-0 ml-auto h-full max-h-none w-[min(22rem,100vw)] rounded-none bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-m-1 rounded-md p-1 text-lg leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
