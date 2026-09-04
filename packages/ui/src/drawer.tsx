"use client";

import { Dialog as RadixDialog } from "radix-ui";

import { useTranslations } from "next-intl";

import { Button } from "./button";
import { DRAWER_EXIT_MS, useAnimatedClose } from "./dialog";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";
import { keysOf } from "./variants";

/**
 * One row per edge: where the panel is pinned, how big it is, and which pair of
 * keyframes carries it in and out. The classes are written out in full rather
 * than assembled from pieces — Tailwind only sees class names that appear
 * literally in the source.
 */
const SIDES = {
  right: {
    panel:
      "inset-y-0 right-0 w-[min(22rem,100vw)] data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right",
    body: "h-full",
  },
  left: {
    panel:
      "inset-y-0 left-0 w-[min(22rem,100vw)] data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left",
    body: "h-full",
  },
  top: {
    panel:
      "inset-x-0 top-0 max-h-[85vh] data-[state=open]:animate-slide-in-top data-[state=closed]:animate-slide-out-top",
    // Not `h-full`: the panel is only as tall as its content, and `height:100%`
    // on a fixed element resolves against the VIEWPORT — the sheet would cover
    // the whole screen.
    body: "max-h-[85vh]",
  },
  bottom: {
    panel:
      "inset-x-0 bottom-0 max-h-[85vh] data-[state=open]:animate-slide-in-bottom data-[state=closed]:animate-slide-out-bottom",
    body: "max-h-[85vh]",
  },
} as const;

export type DrawerSide = keyof typeof SIDES;

/** Derived from the table above — see `variants.ts`. */
export const DRAWER_SIDES = keysOf(SIDES);

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Which edge the panel comes from. Default `right`. */
  side?: DrawerSide;
  children: React.ReactNode;
};

/**
 * A panel sliding in from one of the four edges (`side`, default `right`). It shares Radix Dialog with `Dialog`
 * for exactly the same reasons: focus trap, `Esc`, background scroll lock and
 * portal come for free.
 *
 * It differs from `Dialog` by pinning to the right edge at full height — long
 * content (a profile, a detail view) reads better in a narrow column than in a
 * box centered on screen.
 */
export function Drawer({ open, onClose, title, side = "right", children }: DrawerProps) {
  const t = useTranslations("common");
  const { closing, requestClose } = useAnimatedClose(onClose, DRAWER_EXIT_MS);

  return (
    <RadixDialog.Root
      open={open && !closing}
      onOpenChange={(next) => !next && requestClose()}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <RadixDialog.Content
          className={`fixed z-50 bg-background text-foreground shadow-xl focus:outline-none ${SIDES[side].panel}`}
        >
          <div className={`flex flex-col gap-4 overflow-y-auto p-5 ${SIDES[side].body}`}>
            <div className="flex items-start justify-between gap-4">
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
