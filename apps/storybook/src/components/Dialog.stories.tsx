import type { Meta, StoryObj } from "@storybook/nextjs";
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
 * Chữ demo lấy từ namespace `sb` (`messages/{vi,en}.json`) chứ không viết thẳng,
 * để toolbar ngôn ngữ đổi được cả phần này. `render` phải là một COMPONENT có
 * tên — hook chỉ hợp lệ trong component, arrow function vô danh gọi như hàm
 * thường sẽ vỡ quy tắc hook.
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
