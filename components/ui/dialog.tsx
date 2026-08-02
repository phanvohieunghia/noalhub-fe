"use client";

import { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * Bọc `<dialog>` native: focus trap, `Esc`, và `::backdrop` đều có sẵn ở
 * trình duyệt — không tự viết lại focus trap.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // `showModal()` là hành động lên DOM, không phải setState — an toàn trong
    // effect, và là cách DUY NHẤT bật được focus trap + backdrop của native.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      // `close` phát cả khi người dùng bấm Esc — đó là lý do state của parent
      // phải đồng bộ qua đây, không chỉ qua nút đóng.
      onClose={onClose}
      // Click vào backdrop: target chính là <dialog> (phần content là con của
      // nó), nên so sánh target với currentTarget là đủ để phân biệt.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-4 p-5">
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
