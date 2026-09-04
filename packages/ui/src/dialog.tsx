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
  children: React.ReactNode;
};

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
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const t = useTranslations("common");
  const { closing, requestClose } = useAnimatedClose(onClose, DIALOG_EXIT_MS);

  return (
    <RadixDialog.Root
      open={open && !closing}
      onOpenChange={(next) => !next && requestClose()}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background text-foreground shadow-xl focus:outline-none data-[state=open]:animate-popup-in data-[state=closed]:animate-popup-out">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Radix requires a Title — it is the source of aria-labelledby. */}
              <RadixDialog.Title asChild>
                <Typography variant="h6" as="h2">
                  {title}
                </Typography>
              </RadixDialog.Title>
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
            </div>
            {children}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
