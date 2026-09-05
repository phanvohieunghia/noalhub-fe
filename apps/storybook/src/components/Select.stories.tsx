import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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

/*
 * `value` là mã gửi lên server nên giữ nguyên; chỉ `label` đi qua i18n. Đây đúng
 * hình dạng của một select thật: option đến từ API bằng mã, phần chữ do client
 * dịch.
 */
function useSampleOptions() {
  const t = useTranslations("sb.select");

  return [
    { value: "admin", label: t("admin") },
    { value: "editor", label: t("editor") },
    { value: "viewer", label: t("viewer") },
  ];
}

export const Default: Story = {
  args: {},
  render: function DefaultStory(args) {
    const t = useTranslations("sb.select");
    const options = useSampleOptions();

    return (
      <Select
        {...args}
        label={args.label || t("role")}
        placeholder={args.placeholder || t("rolePlaceholder")}
        options={options}
      />
    );
  },
};

export const WithError: Story = {
  args: {},
  render: function WithErrorStory(args) {
    const t = useTranslations("sb.select");
    const options = useSampleOptions();

    return (
      <Select
        {...args}
        label={args.label || t("role")}
        placeholder={args.placeholder || t("rolePlaceholder")}
        error={args.error || t("error")}
        options={options}
      />
    );
  },
};

export const Disabled: Story = {
  args: { defaultValue: "admin", disabled: true },
  render: function DisabledStory(args) {
    const t = useTranslations("sb.select");
    const options = useSampleOptions();

    return <Select {...args} label={args.label || t("role")} options={options} />;
  },
};
