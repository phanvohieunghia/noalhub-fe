import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
import { Drawer, DRAWER_SIDES, type DrawerSide } from "@noalhub/ui/drawer";
import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";

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
    const [open, setOpen] = useState(false);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>Mở Panel Cạnh Phải (Open Drawer)</Button>
        <Drawer open={open} onClose={() => setOpen(false)} title="Thông tin chi tiết">
          <div className="flex flex-col gap-3">
            <Typography variant="title-4">Thông tin cá nhân</Typography>
            <Typography variant="body-3" className="opacity-80">
              Đây là nội dung được trượt ra từ góc phải màn hình, thích hợp cho việc xem nhanh thông tin hoặc biểu mẫu chỉnh sửa gọn gàng.
            </Typography>
          </div>
          <div className="mt-auto flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Đóng
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
    const [side, setSide] = useState<DrawerSide | null>(null);

    return (
      <div className="flex flex-wrap gap-2">
        {DRAWER_SIDES.map((each) => (
          <Button key={each} variant="outline" onClick={() => setSide(each)}>
            Mở từ {LABELS[each]}
          </Button>
        ))}

        <Drawer
          open={side !== null}
          side={side ?? "right"}
          onClose={() => setSide(null)}
          title={`Trượt vào từ ${LABELS[side ?? "right"]}`}
        >
          <Typography variant="body-3" className="text-muted-foreground">
            Panel dùng chung một component, chỉ khác prop `side`. Cạnh trái/phải
            cao hết màn hình, cạnh trên/dưới cao theo nội dung (tối đa 85vh).
          </Typography>
          <div className="mt-auto flex justify-end pt-4">
            <Button variant="outline" onClick={() => setSide(null)}>
              Đóng
            </Button>
          </div>
        </Drawer>
      </div>
    );
  },
};

const LABELS: Record<DrawerSide, string> = {
  right: "phải",
  left: "trái",
  top: "trên",
  bottom: "dưới",
};
