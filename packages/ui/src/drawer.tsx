"use client";

import { Dialog as RadixDialog } from "radix-ui";

import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * Panel trượt từ mép phải. Dùng chung Radix Dialog với `Dialog` vì lý do giống
 * hệt: focus trap, `Esc`, khoá scroll nền và portal đã có sẵn.
 *
 * Khác `Dialog` ở chỗ dán vào mép phải và cao hết màn hình — nội dung dài
 * (hồ sơ, chi tiết) đọc dễ hơn trong cột hẹp so với hộp giữa màn hình.
 */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <RadixDialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(22rem,100vw)] bg-background text-foreground shadow-xl focus:outline-none">
          <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-4">
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
