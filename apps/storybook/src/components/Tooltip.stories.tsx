import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
 * `label` is left empty in `args` and falls back to the translated sample when it
 * has no value: the Controls field still overrides it, and the toolbar's language
 * switch still applies.
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

/** Long text wraps on its own, capped at 16rem. */
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
