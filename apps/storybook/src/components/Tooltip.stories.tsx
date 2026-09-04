import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "@noalhub/ui/button";
import { Tooltip } from "@noalhub/ui/tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Elements/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
      description: "Phía hiện bong bóng so với phần tử",
    },
    delayMs: { control: "number", description: "Trễ trước khi hiện (ms)" },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: { label: "Nhấn để sao chép tên icon", side: "top", delayMs: 200 },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="outline">Di chuột vào đây</Button>
    </Tooltip>
  ),
};

/** Chữ dài tự xuống dòng, tối đa 16rem. */
export const LongText: Story = {
  args: {
    label:
      "Tên đầy đủ của icon rất dài nên trong lưới bị cắt bằng dấu ba chấm — tooltip là chỗ đọc trọn vẹn.",
    side: "bottom",
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="outline">Chữ dài</Button>
    </Tooltip>
  ),
};
