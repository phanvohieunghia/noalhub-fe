import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
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

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>Mở Hộp Thoại (Open Dialog)</Button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Xác nhận hành động">
          <Typography variant="body-2">
            Bạn có chắc chắn muốn thực hiện hành động này không? Dữ liệu sau khi xóa sẽ không thể khôi phục.
          </Typography>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Đồng ý
            </Button>
          </div>
        </Dialog>
      </div>
    );
  },
};
