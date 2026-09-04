import type { Meta, StoryObj } from "@storybook/nextjs";
import { Textarea } from "@noalhub/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Elements/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Nhãn hiển thị phía trên textarea",
    },
    error: {
      control: "text",
      description: "Thông báo lỗi bên dưới textarea",
    },
    placeholder: {
      control: "text",
      description: "Placeholder gợi ý",
    },
    rows: {
      control: "number",
      description: "Số hàng hiển thị",
    },
    disabled: {
      control: "boolean",
      description: "Trạng thái vô hiệu hóa",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: "Mô tả nội dung",
    placeholder: "Nhập mô tả chi tiết tại đây...",
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: "Lý do từ chối",
    placeholder: "Nhập lý do...",
    error: "Lý do không được để trống khi từ chối.",
    rows: 3,
  },
};

export const Disabled: Story = {
  args: {
    label: "Nội dung chỉ đọc",
    value: "Nội dung này không thể chỉnh sửa.",
    disabled: true,
    rows: 3,
  },
};
