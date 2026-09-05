import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
import React from "react";
import {
  Typography,
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_WEIGHTS,
} from "@noalhub/ui/typography";

/**
 * The options below are read from the component's own exported lists, never
 * retyped: a variant added to `typography.tsx` shows up in the dropdown and in
 * `AllVariants` on its own, and one that is removed cannot be left behind here.
 */
const meta: Meta<typeof Typography> = {
  title: "UI/Elements/Typography",
  component: Typography,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    variant: {
      control: "select",
      options: TYPOGRAPHY_VARIANTS,
      description: "Kiểu và kích thước của font chữ",
    },
    weight: {
      control: "select",
      options: TYPOGRAPHY_WEIGHTS,
      description: "Độ đậm của chữ — bỏ trống thì mỗi variant có mặc định riêng",
    },
    children: {
      control: "text",
      description: "Nội dung văn bản",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Typography>;

/*
 * `children` lấy từ `sb.typography` khi ô Controls để trống — gõ vào vẫn đè
 * được, mà đổi ngôn ngữ thì câu mẫu cũng đổi.
 */
export const Playground: Story = {
  args: { variant: "body-2" },
  render: function PlaygroundStory(args) {
    const t = useTranslations("sb.typography");
    return <Typography {...args}>{args.children || t("children")}</Typography>;
  },
};

/** Every variant at its default weight — the list follows the component. */
export const AllVariants: Story = {
  render: function AllVariantsStory() {
    const t = useTranslations("sb.typography");

    return (
      <div className="flex flex-col gap-4">
      {TYPOGRAPHY_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-0.5">
          <code className="text-body-4 text-muted-foreground">{variant}</code>
          <Typography variant={variant}>{t("sample")}</Typography>
        </div>
      ))}
      </div>
    );
  },
};

/** The three weights on one size, to compare them directly. */
export const Weights: Story = {
  render: function WeightsStory() {
    const t = useTranslations("sb.typography");

    return (
      <div className="flex flex-col gap-3">
        {TYPOGRAPHY_WEIGHTS.map((weight) => (
          <Typography key={weight} variant="body-1" weight={weight}>
            {t("weightSample", { weight })}
          </Typography>
        ))}
      </div>
    );
  },
};

/**
 * `as` is deliberately decoupled from `variant`: heading level is document
 * structure, type size is visual. A level-2 heading that has to look small is
 * `variant="h4" as="h2"`, not a changed variant.
 */
export const TagVsSize: Story = {
  render: function TagVsSizeStory() {
    const t = useTranslations("sb.typography");

    return (
      <Typography variant="h4" as="h2">
        {t("renderedAs")}
      </Typography>
    );
  },
};
