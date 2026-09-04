import type { Meta, StoryObj } from "@storybook/nextjs";
import { StatCard } from "@noalhub/ui/stat-card";

const meta: Meta<typeof StatCard> = {
  title: "UI/Data Display/StatCard",
  component: StatCard,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Tiêu đề số liệu thống kê",
    },
    value: {
      control: "text",
      description: "Giá trị số liệu",
    },
    hint: {
      control: "text",
      description: "Gợi ý / Chú thích ngữ cảnh",
    },
    isLoading: {
      control: "boolean",
      description: "Trạng thái đang tải dữ liệu",
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: "Tổng người dùng",
    value: 12450,
    hint: "+12% so với tháng trước",
    isLoading: false,
  },
};

export const TextValue: Story = {
  args: {
    label: "Doanh thu",
    value: "150.000.000 ₫",
    hint: "Tính từ đầu năm",
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    label: "Lượt truy cập",
    value: 0,
    isLoading: true,
  },
};
