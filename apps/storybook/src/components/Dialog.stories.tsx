import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@noalhub/ui/dialog";
import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";

const meta: Meta<typeof Dialog> = {
  title: "UI/Overlays/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

/*
 * Demo copy comes from the `sb` namespace (`messages/{vi,en}.json`) rather than
 * being inlined, so the language toolbar switches this too. `render` has to be a
 * NAMED COMPONENT — hooks are only valid inside a component, and an anonymous
 * arrow function called like a plain function breaks the rules of hooks.
 */
export const Interactive: Story = {
  render: function DialogStory() {
    const t = useTranslations("sb.dialog");
    const [open, setOpen] = useState(false);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>{t("open")}</Button>
        <Dialog open={open} onClose={() => setOpen(false)} title={t("title")}>
          <Typography variant="body-2">{t("body")}</Typography>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              {t("confirm")}
            </Button>
          </div>
        </Dialog>
      </div>
    );
  },
};
