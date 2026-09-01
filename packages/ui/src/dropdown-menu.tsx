"use client";

import { DropdownMenu as RadixDropdownMenu } from "radix-ui";

type DropdownMenuProps = {
  /** Phần tử mở menu — nhận `asChild`, nên truyền đúng một element. */
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Canh mép nào của trigger. Mặc định canh phải: menu tài khoản nằm góc phải. */
  align?: "start" | "center" | "end";
  className?: string;
};

/**
 * Menu thả xuống dựng trên Radix DropdownMenu: click ra ngoài, `Esc`, điều
 * hướng bàn phím, `aria-expanded` và định vị tránh tràn viewport đều có sẵn.
 *
 * `modal={false}` để nền vẫn cuộn được khi menu mở — menu này là phụ trợ trong
 * header, không phải modal.
 */
export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className = "",
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root modal={false}>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={8}
          className={`z-50 rounded-lg border border-border bg-surface p-3 text-surface-foreground shadow-lg focus:outline-none ${className}`}
        >
          {children}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}

/**
 * Một dòng bấm được trong menu. Radix tự lo highlight bằng bàn phím/chuột qua
 * `data-highlighted`, và tự đóng menu sau khi chọn.
 */
export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadixDropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body-3 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-muted ${className}`}
    >
      {children}
    </RadixDropdownMenu.Item>
  );
}

export function DropdownMenuSeparator() {
  return <RadixDropdownMenu.Separator className="my-2 h-px bg-border" />;
}
