"use client";

import { THEME_MODES, type ThemeMode } from "@noalhub/core/theme/types";
import { useTranslations } from "next-intl";

import { Button } from "../button";
import { Icon, ICONS } from "../icons";
import { useTheme } from "./theme-provider";

const MODE_ICONS: Record<ThemeMode, string> = {
  light: ICONS.sun,
  dark: ICONS.moon,
  system: ICONS.monitor,
};

/**
 * Three buttons in a group, **not** a two-state toggle: `system` has to be
 * explicitly selectable, and the user has to see which mode they are in — a
 * toggle cannot say "following the system".
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // `common` is the namespace every page of both apps loads — a shared
  // component must not pin one app's namespace (`docs/i18n.md` §6).
  const t = useTranslations("common.theme");
  const { mode, setMode, mounted } = useTheme();

  return (
    <div
      role="group"
      aria-label={t("label")}
      // Before hydration the client does not know which mode is selected (the
      // server cannot read localStorage). All 3 buttons still render so the
      // layout does not shift, but the "selected" marking is hidden — showing
      // it would paint the wrong button first and then jump to the right one.
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
            title={t(value)}
          >
            <Icon icon={MODE_ICONS[value]} />
            <span className="sr-only">{t(value)}</span>
          </Button>
        );
      })}
    </div>
  );
}
