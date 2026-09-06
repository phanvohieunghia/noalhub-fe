"use client";

import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Spinner } from "@noalhub/ui/spinner";

/**
 * The send button: an icon, not the word.
 *
 * Icon-only means the label has to move to `aria-label` — a button whose only
 * content is an `aria-hidden` glyph announces nothing at all. The copy stays in
 * `web.chat.composer.send`, so it is still translated; it is simply read rather
 * than shown.
 *
 * `size="icon"` is a square `size-10`, the same height as the default button it
 * replaces — so the composer row does not change height.
 */
export function SendButton({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  const t = useTranslations("web.chat.composer");

  return (
    // A real `type="submit"`, so the form can be sent from the keyboard and not
    // only with the mouse.
    <Button
      type="submit"
      size="icon"
      aria-label={t("send")}
      disabled={disabled}
      className="shrink-0"
    >
      {pending ? <Spinner className="size-4" /> : <Icon icon={ICONS.send} />}
    </Button>
  );
}
