"use client";

import hotToast, { Toaster, resolveValue, type ToastOptions } from "react-hot-toast";

import type { AlertTone } from "./alert";
import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";

/**
 * Transient notifications: they float above the page, stack, and disappear on
 * their own.
 *
 * The in-flow sibling is `alert.tsx` — that one takes space in the layout and
 * stays until its owner stops rendering it. Rule of thumb: a form-level error
 * the user must fix is an `Alert` (it must not vanish while they read the
 * field); the confirmation of an action they just took is a `Toast`.
 *
 * Built on `react-hot-toast` rather than by hand: what makes a toast system
 * hard is the queue — stacking, reordering as one expires, pausing the timer on
 * hover, keeping the live region from re-announcing everything on every change.
 * Only the rendering is ours, so the tones still come from the theme tokens.
 */

/** Same four tones as `Alert`, deliberately — one vocabulary for both. */
export type ToastTone = AlertTone;

/**
 * `live` overrides what `react-hot-toast` puts in `ariaProps` (always polite):
 * an error interrupts, the rest wait for a pause in what the screen reader is
 * already saying.
 */
const TONES = {
  error: { icon: ICONS.error, className: "text-danger", role: "alert", live: "assertive" },
  success: { icon: ICONS.success, className: "text-success", role: "status", live: "polite" },
  info: { icon: ICONS.info, className: "text-accent", role: "status", live: "polite" },
  warning: { icon: ICONS.warning, className: "text-warning", role: "status", live: "polite" },
} as const satisfies Record<
  ToastTone,
  { icon: string; className: string; role: string; live: "polite" | "assertive" }
>;

/**
 * `react-hot-toast` carries no tone of its own (its API is success/error/
 * loading/blank), so the tone rides along in `className` — the one free-form
 * string it passes through to the renderer untouched. Read back in `ToastHost`.
 */
function notify(tone: ToastTone, message: string, options?: ToastOptions) {
  return hotToast(message, { ...options, className: tone });
}

/**
 * Fire a toast from anywhere — event handlers, mutation callbacks, outside
 * React entirely. `<ToastHost />` has to be mounted for it to show up.
 *
 * Messages are TRANSLATED STRINGS: call `t()` at the call site. This module has
 * no namespace of its own on purpose — it is shared by both apps.
 */
export const toast = {
  error: (message: string, options?: ToastOptions) => notify("error", message, options),
  success: (message: string, options?: ToastOptions) => notify("success", message, options),
  info: (message: string, options?: ToastOptions) => notify("info", message, options),
  warning: (message: string, options?: ToastOptions) => notify("warning", message, options),
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
};

/** Default lifetime. Errors get longer: they are the ones worth reading twice. */
const DURATION = { default: 4000, error: 6000 } as const;

/**
 * Mount once, next to the other providers in the root layout. Renders nothing
 * until a toast is fired.
 *
 * `closeLabel` comes in as a prop instead of being read from `common` here: a
 * package-level `useTranslations` would pin this component to one app's
 * namespace layout (see AGENTS.md).
 */
export function ToastHost({ closeLabel }: { closeLabel: string }) {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      containerClassName="!z-[100]"
      toastOptions={{
        duration: DURATION.default,
        error: { duration: DURATION.error },
      }}
    >
      {(instance) => {
        const tone = (instance.className as ToastTone) ?? "info";
        const { icon, className, role, live } = TONES[tone] ?? TONES.info;

        return (
          <Typography
            variant="body-3"
            {...instance.ariaProps}
            role={role}
            aria-live={live}
            className={`pointer-events-auto flex w-[min(28rem,calc(100vw-2rem))] items-start gap-2
              rounded-lg border px-3 py-2.5 shadow-lg
              border-border bg-surface text-surface-foreground
              ${
                instance.visible
                  ? "motion-safe:animate-slide-in-top"
                  : "motion-safe:animate-slide-out-top opacity-0"
              }`}
          >
            <Icon icon={icon} className={`mt-0.5 size-4 shrink-0 ${className}`} />
            {/* `resolveValue` unwraps the message: it may be a render function
                (react-hot-toast lets a caller pass one), not just a string. */}
            <span className="flex-1">{resolveValue(instance.message, instance)}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => hotToast.dismiss(instance.id)}
              aria-label={closeLabel}
              className="-mr-1 shrink-0"
            >
              <Icon icon={ICONS.close} className="size-4" />
            </Button>
          </Typography>
        );
      }}
    </Toaster>
  );
}
