"use client";

import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";
import { Spinner } from "@noalhub/ui/spinner";

export function SendButton({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  const t = useTranslations("web.chat.composer");

  return (
    // A real `type="submit"`, so the form can be sent from the keyboard and not
    // only with the mouse.
    <Button type="submit" disabled={disabled} className="shrink-0">
      {pending ? <Spinner className="size-3.5" /> : null}
      {t("send")}
    </Button>
  );
}
