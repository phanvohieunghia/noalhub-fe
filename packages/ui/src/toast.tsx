"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";
import { keysOf } from "./variants";

/**
 * Inline toasts (form-level banners): one tone table, four thin wrappers.
 * Colours come from the status tokens (`docs/theme.md`), so they follow
 * light/dark on their own.
 */
const TONES = {
  error: {
    icon: ICONS.error,
    className: "border-danger/30 bg-danger/10 text-danger",
    role: "alert",
  },
  success: {
    icon: ICONS.success,
    className: "border-success/30 bg-success/10 text-success",
    role: "status",
  },
  info: {
    icon: ICONS.info,
    className: "border-primary/30 bg-primary/10 text-primary",
    role: "status",
  },
  warning: {
    icon: ICONS.warning,
    className: "border-warning/30 bg-warning/10 text-warning",
    role: "status",
  },
} as const;

export type ToastTone = keyof typeof TONES;

/** The list, derived from the table above — see `variants.ts`. */
export const TOAST_TONES = keysOf(TONES);

export type ToastProps = {
  tone: ToastTone;
  message?: string | null;
  /**
   * Makes the toast dismissible: shows a close button, and is what the
   * auto-dismiss timer calls. Without it the toast stays until the owner stops
   * rendering it — which is what a form-level error should do.
   */
  onDismiss?: () => void;
  /**
   * Dismiss on its own after this many ms. Only has an effect together with
   * `onDismiss` — closing is the owner's state change, never ours.
   */
  autoDismissMs?: number;
};

export function Toast({ tone, message, onDismiss, autoDismissMs }: ToastProps) {
  // The timer restarts whenever the text changes, so a second message replacing
  // the first is shown for its full duration instead of inheriting what is left
  // of the previous one.
  useEffect(() => {
    if (!message || !onDismiss || !autoDismissMs) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, autoDismissMs]);

  const t = useTranslations("common");
  if (!message) return null;
  const { icon, className, role } = TONES[tone];

  return (
    <Typography
      variant="body-3"
      role={role}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 ${className}`}
    >
      <Icon icon={icon} className="mt-0.5 size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label={t("actions.close")}
          className="-mr-1 shrink-0"
        >
          <Icon icon={ICONS.close} className="size-4" />
        </Button>
      ) : null}
    </Typography>
  );
}

type ToneToastProps = Omit<ToastProps, "tone">;

/** Banner for form-level errors (5xx, offline, anything not tied to a field). */
export function ToastError(props: ToneToastProps) {
  return <Toast tone="error" {...props} />;
}

export function ToastSuccess(props: ToneToastProps) {
  return <Toast tone="success" {...props} />;
}

export function ToastInfo(props: ToneToastProps) {
  return <Toast tone="info" {...props} />;
}

export function ToastWarning(props: ToneToastProps) {
  return <Toast tone="warning" {...props} />;
}
