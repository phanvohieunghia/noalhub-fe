"use client";

import { Dialog as RadixDialog } from "radix-ui";

import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * Modal dựng trên Radix Dialog: focus trap, `Esc`, khoá scroll nền, portal và
 * `aria-modal` đều do Radix lo — không tự viết lại.
 *
 * Giữ API `open` / `onClose` (thay vì `onOpenChange` của Radix) để mọi chỗ gọi
 * cũ không phải sửa; Radix chỉ phát `onOpenChange(false)` nên map thẳng được.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background text-foreground shadow-xl focus:outline-none">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Radix bắt buộc có Title — nó là nguồn của aria-labelledby. */}
              <RadixDialog.Title asChild>
                <Typography variant="h6" as="h2">
                  {title}
                </Typography>
              </RadixDialog.Title>
              <RadixDialog.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Đóng" className="-m-1">
                  <Icon icon={ICONS.close} />
                </Button>
              </RadixDialog.Close>
            </div>
            {children}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
