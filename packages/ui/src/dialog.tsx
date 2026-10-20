"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog as RadixDialog } from "radix-ui";

import { useTranslations } from "next-intl";

import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /**
   * `md` is the centred card; `lg` is the same card at 720px for forms with
   * two columns of fields (it scrolls when the viewport is shorter). `fullscreen` fills the viewport instead — for
   * content that needs the room (a diagram to pan and zoom, a large preview);
   * its body is the scroll container, so the header stays put.
   */
  size?: DialogSize;
  /** An iconify name shown before the title (e.g. a verdict check). */
  icon?: string;
  /** Colours the title and icon: a result dialog reads as success / danger at a glance. */
  tone?: DialogTone;
  /** Sits between the title and the close button — a toolbar for the content. */
  actions?: React.ReactNode;
  /**
   * Leave out the header's close button — for a window that has its own way out
   * (an editor's exit-full-screen button). `Esc` and the overlay still close it.
   */
  hideClose?: boolean;
  children: React.ReactNode;
};

export type DialogSize = "md" | "lg" | "fullscreen" | "inset";
export type DialogTone = "default" | "success" | "danger";

const TITLE_TONES = {
  default: "",
  success: "text-success",
  danger: "text-danger",
} as const;

/** A result dialog wears its verdict: a tone-coloured border and a faint tint over the surface. */
const CARD_TONES = {
  default: "",
  success: "border border-success",
  danger: "border border-danger",
} as const;

const BODY_TONES = {
  default: "",
  success: "rounded-[inherit] bg-success/8",
  danger: "rounded-[inherit] bg-danger/8",
} as const;

const CONTENT_SIZES = {
  md: "top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl",
  lg: "top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[min(45rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border shadow-xl",
  fullscreen: "inset-0 flex flex-col",
  /** Inset from the viewport with the page showing around it. */
  inset:
    "inset-4 flex flex-col overflow-hidden rounded-lg border border-border shadow-xl md:inset-10",
} as const;

const BODY_SIZES = {
  md: "flex flex-col gap-4 p-5",
  lg: "flex flex-col gap-4 p-6",
  fullscreen: "flex min-h-0 flex-1 flex-col gap-4 p-5",
  inset: "flex min-h-0 flex-1 flex-col",
} as const;

/** Kept in sync with `--animate-popup-out` / `--animate-slide-out-right`. */
export const DIALOG_EXIT_MS = 150;
export const DRAWER_EXIT_MS = 160;

/**
 * Plays the exit animation before telling the parent the modal is closed.
 *
 * Most call sites render the modal as `{open ? <Dialog open … /> : null}`, so
 * `onClose` unmounts it — Radix never gets to animate anything out. So the close
 * is taken in two steps: flip Radix to `closed` (the exit animation runs), and
 * only call the parent once it has finished. Call sites that keep the component
 * mounted with `open={false}` behave the same, just with the delay first.
 *
 * Under `prefers-reduced-motion` the animation is a short fade instead of a zoom
 * (see `theme.css`), not nothing — so the delay still matches what is on screen.
 */
function useAnimatedClose(onClose: () => void, exitMs: number) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const requestClose = useCallback(() => {
    setClosing(true);
    timer.current = setTimeout(() => {
      setClosing(false);
      onClose();
    }, exitMs);
  }, [onClose, exitMs]);

  return { closing, requestClose };
}

export { useAnimatedClose };

/**
 * A modal built on Radix Dialog: focus trap, `Esc`, background scroll lock,
 * portal and `aria-modal` all come from Radix — none of it is reimplemented.
 *
 * The `open` / `onClose` API is kept (instead of Radix's `onOpenChange`) so no
 * existing call site has to change; Radix only ever emits
 * `onOpenChange(false)` here, so it maps directly.
 */
export function Dialog({
  open,
  onClose,
  title,
  size = "md",
  icon,
  tone = "default",
  actions,
  hideClose = false,
  children,
}: DialogProps) {
  const t = useTranslations("common");
  const { closing, requestClose } = useAnimatedClose(onClose, DIALOG_EXIT_MS);

  return (
    <RadixDialog.Root
      open={open && !closing}
      onOpenChange={(next) => !next && requestClose()}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <RadixDialog.Content
          className={`fixed z-50 ${tone === "default" ? "bg-background" : "bg-surface"} text-foreground focus:outline-none data-[state=open]:animate-popup-in data-[state=closed]:animate-popup-out ${CONTENT_SIZES[size]} ${CARD_TONES[tone]}`}
        >
          <div className={`${BODY_SIZES[size]} ${BODY_TONES[tone]}`}>
            <div
              className={
                size === "inset"
                  ? "flex items-center justify-between gap-4 border-b border-border px-4 py-3"
                  : "flex items-start justify-between gap-4"
              }
            >
              {/* Radix requires a Title — it is the source of aria-labelledby. */}
              <RadixDialog.Title asChild>
                <Typography
                  variant={size === "inset" ? "title-3" : "h6"}
                  as="h2"
                  className={`flex min-w-0 flex-1 items-center gap-2 truncate ${TITLE_TONES[tone]}`}
                >
                  {icon ? <Icon icon={icon} className="size-5 shrink-0" /> : null}
                  {title}
                </Typography>
              </RadixDialog.Title>
              {actions ? (
                <div className="flex items-center gap-1">{actions}</div>
              ) : null}
              {hideClose ? null : (
                <RadixDialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("actions.close")}
                    className="-m-1"
                  >
                    <Icon icon={ICONS.close} />
                  </Button>
                </RadixDialog.Close>
              )}
            </div>
            {size === "inset" ? (
              <div className="flex min-h-0 flex-1 flex-col bg-surface p-4">{children}</div>
            ) : (
              children
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
