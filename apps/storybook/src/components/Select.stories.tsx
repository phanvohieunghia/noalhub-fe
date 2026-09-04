import type { Meta, StoryObj } from "@storybook/nextjs";
import { Select } from "@noalhub/ui/select";

const meta: Meta<typeof Select> = {
  title: "UI/Elements/Select",
  component: Select,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Nhãn hiển thị phía trên",
    },
    placeholder: {
      control: "text",
      description: "Placeholder cho lựa chọn rỗng",
    },
    error: {
      control: "text",
      description: "Thông báo lỗi bên dưới",
    },
    disabled: {
      control: "boolean",
      description: "Trạng thái vô hiệu hóa",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const sampleOptions = [
  { value: "admin", label: "Quản trị viên (Admin)" },
  { value: "editor", label: "Biên tập viên (Editor)" },
  { value: "viewer", label: "Người xem (Viewer)" },
];

export const Default: Story = {
  args: {
    label: "Vai trò",
    placeholder: "-- Chọn một vai trò --",
    options: sampleOptions,
  },
};

export const WithError: Story = {
  args: {
    label: "Vai trò",
    placeholder: "-- Chọn một vai trò --",
    options: sampleOptions,
    error: "Vui lòng chọn vai trò hợp lệ.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Vai trò",
    options: sampleOptions,
    defaultValue: "admin",
    disabled: true,
  },
};
