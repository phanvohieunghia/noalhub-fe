import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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

/*
 * Nhãn/placeholder lấy từ `sb.input` khi ô Controls để trống — gõ vào vẫn đè
 * được, mà đổi ngôn ngữ thì mặc định cũng đổi theo.
 */
export const Default: Story = {
  args: {},
  render: function DefaultStory(args) {
    const t = useTranslations("sb.input");

    return (
      <Input
        {...args}
        label={args.label || t("username")}
        placeholder={args.placeholder || t("namePlaceholder")}
      />
    );
  },
};

export const WithError: Story = {
  args: { label: "Email", placeholder: "example@gmail.com", defaultValue: "example@" },
  render: function WithErrorStory(args) {
    const t = useTranslations("sb.input");
    return <Input {...args} error={args.error || t("emailError")} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: function DisabledStory(args) {
    const t = useTranslations("sb.input");

    return (
      <Input
        {...args}
        label={args.label || t("coupon")}
        placeholder={args.placeholder || t("couponPlaceholder")}
      />
    );
  },
};
