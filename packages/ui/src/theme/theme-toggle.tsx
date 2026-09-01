"use client";

import { THEME_MODES, type ThemeMode } from "@noalhub/core/theme/types";

import { Button } from "../button";
import { Icon, ICONS } from "../icons";
import { useTheme } from "./theme-provider";

const LABELS: Record<ThemeMode, string> = {
  light: "Sáng",
  dark: "Tối",
  system: "Hệ thống",
};

const MODE_ICONS: Record<ThemeMode, string> = {
  light: ICONS.sun,
  dark: ICONS.moon,
  system: ICONS.monitor,
};

/**
 * Ba nút trong một nhóm, **không** phải nút bập bênh hai trạng thái: `system`
 * phải chọn được tường minh, và user phải nhìn ra mình đang ở chế độ nào —
 * một cái nút bập bênh không nói được "đang theo hệ thống".
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, setMode, mounted } = useTheme();

  return (
    <div
      role="group"
      aria-label="Giao diện"
      // Trước khi hydrate, client chưa biết mode nào đang chọn (server không
      // đọc được localStorage). Vẫn render đủ 3 nút để không nhảy layout,
      // nhưng ẩn phần đánh dấu "đang chọn" — bật lên thì lần vẽ đầu sẽ tô sai
      // ô rồi mới nhảy sang ô đúng.
      className={`inline-flex items-center gap-0.5 rounded-full border border-border p-0.5 ${className}`}
    >
      {THEME_MODES.map((value) => {
        const active = mounted && mode === value;
        return (
          <Button
            key={value}
            variant={active ? "primary" : "ghost"}
            size="icon-sm"
            shape="circle"
            onClick={() => setMode(value)}
            aria-pressed={active}
            title={LABELS[value]}
          >
            <Icon icon={MODE_ICONS[value]} />
            <span className="sr-only">{LABELS[value]}</span>
          </Button>
        );
      })}
    </div>
  );
}
