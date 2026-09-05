import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "@noalhub/ui/button";
import { useTranslations } from "next-intl";
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

/*
 * `label` để trống trong `args` rồi lấy câu mẫu đã dịch khi không có giá trị:
 * gõ vào ô Controls vẫn đè được, mà đổi ngôn ngữ trên toolbar cũng ăn.
 */
export const Default: Story = {
  args: { side: "top", delayMs: 200 },
  render: function DefaultStory(args) {
    const t = useTranslations("sb.tooltip");

    return (
      <Tooltip {...args} label={args.label || t("copyIcon")}>
        <Button variant="outline">{t("hover")}</Button>
      </Tooltip>
    );
  },
};

/** Chữ dài tự xuống dòng, tối đa 16rem. */
export const LongText: Story = {
  args: { side: "bottom" },
  render: function LongTextStory(args) {
    const t = useTranslations("sb.tooltip");

    return (
      <Tooltip {...args} label={args.label || t("iconName")}>
        <Button variant="outline">{t("long")}</Button>
      </Tooltip>
    );
  },
};
