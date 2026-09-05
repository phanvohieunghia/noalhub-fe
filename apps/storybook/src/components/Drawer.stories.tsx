import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
import { Drawer, DRAWER_SIDES, type DrawerSide } from "@noalhub/ui/drawer";
import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";
import { useTranslations } from "next-intl";

const meta: Meta<typeof Drawer> = {
  title: "UI/Overlays/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Interactive: Story = {
  render: function InteractiveStory() {
    const t = useTranslations("sb.drawer");
    const [open, setOpen] = useState(false);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>
          {t("open", { side: t("sides.right") })}
        </Button>
        <Drawer open={open} onClose={() => setOpen(false)} title={t("title")}>
          <div className="flex flex-col gap-3">
            <Typography variant="title-4">{t("section")}</Typography>
            <Typography variant="body-3" className="opacity-80">
              {t("body")}
            </Typography>
          </div>
          <div className="mt-auto flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("close")}
            </Button>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Cùng một Drawer, mở từ cả bốn cạnh màn hình. */
export const AllSides: Story = {
  render: function AllSidesStory() {
    const t = useTranslations("sb.drawer");
    const [side, setSide] = useState<DrawerSide | null>(null);

    return (
      <div className="flex flex-wrap gap-2">
        {DRAWER_SIDES.map((each) => (
          <Button key={each} variant="outline" onClick={() => setSide(each)}>
            {t("openFrom", { side: t(`sides.${each}`) })}
          </Button>
        ))}

        <Drawer
          open={side !== null}
          side={side ?? "right"}
          onClose={() => setSide(null)}
          title={t("slideFrom", { side: t(`sides.${side ?? "right"}`) })}
        >
          <Typography variant="body-3" className="text-muted-foreground">
            {t("note")}
          </Typography>
          <div className="mt-auto flex justify-end pt-4">
            <Button variant="outline" onClick={() => setSide(null)}>
              {t("close")}
            </Button>
          </div>
        </Drawer>
      </div>
    );
  },
};
