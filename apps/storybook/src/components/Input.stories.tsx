import type { Meta, StoryObj } from "@storybook/nextjs";
import { Input } from "@noalhub/ui/input";

const meta: Meta<typeof Input> = {
  title: "UI/Elements/Input",
  component: Input,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Nhãn hiển thị phía trên input",
    },
    error: {
      control: "text",
      description: "Thông báo lỗi hiển thị phía dưới input",
    },
    disabled: {
      control: "boolean",
      description: "Trạng thái vô hiệu hóa",
    },
    placeholder: {
      control: "text",
      description: "Đoạn text placeholder",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Tên đăng nhập",
    placeholder: "Nhập tên của bạn...",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "example@gmail.com",
    error: "Định dạng email không hợp lệ.",
    defaultValue: "example@",
  },
};

export const Disabled: Story = {
  args: {
    label: "Mã giảm giá",
    placeholder: "Nhập mã...",
    disabled: true,
  },
};
