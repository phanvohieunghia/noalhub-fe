import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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
  args: { value: 12450, isLoading: false },
  render: function DefaultStory(args) {
    const t = useTranslations("sb.statCard");

    return (
      <StatCard
        {...args}
        label={args.label || t("users")}
        hint={args.hint || t("visitsHint")}
      />
    );
  },
};

export const TextValue: Story = {
  args: { value: "150.000.000 ₫", isLoading: false },
  render: function TextValueStory(args) {
    const t = useTranslations("sb.statCard");

    return (
      <StatCard
        {...args}
        label={args.label || t("revenue")}
        hint={args.hint || t("usersHint")}
      />
    );
  },
};

export const Loading: Story = {
  args: { value: 0, isLoading: true },
  render: function LoadingStory(args) {
    const t = useTranslations("sb.statCard");
    return <StatCard {...args} label={args.label || t("visits")} />;
  },
};
