import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
import {
  Button,
  BUTTON_SHAPES,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
} from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";

const meta: Meta<typeof Button> = {
  title: "UI/Elements/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: BUTTON_VARIANTS,
      description: "Thay đổi giao diện của nút",
    },
    size: {
      control: "select",
      options: BUTTON_SIZES,
      description: "Kích thước của nút",
    },
    shape: {
      control: "radio",
      options: BUTTON_SHAPES,
      description: "Độ bo góc của nút",
    },
    disabled: {
      control: "boolean",
      description: "Trạng thái vô hiệu hóa",
    },
    children: {
      control: "text",
      description: "Nội dung hiển thị bên trong nút",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/*
 * `children` bỏ khỏi `args` và lấy từ `sb.button` khi trống: ô Controls vẫn gõ
 * đè được, còn mặc định thì đổi theo toolbar ngôn ngữ.
 */
export const Playground: Story = {
  args: { variant: "primary", size: "md" },
  render: function PlaygroundStory(args) {
    const t = useTranslations("sb.button");
    return <Button {...args}>{args.children || t("default")}</Button>;
  },
};

/**
 * Every variant against every size. Built by iterating the exported lists, so a
 * variant or size added to `button.tsx` appears here on its own — a grid
 * written out by hand is one that silently stops covering the component.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {BUTTON_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          <code className="w-20 text-body-4 text-muted-foreground">{variant}</code>
          {BUTTON_SIZES.map((size) => (
            <Button key={size} variant={variant} size={size} aria-label={size}>
              {size.startsWith("icon") ? <Icon icon={ICONS.add} /> : size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Both shapes, so the `rounded-full` override is visible side by side. */
export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {BUTTON_SHAPES.map((shape) => (
        <Button key={shape} shape={shape}>
          {shape}
        </Button>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { variant: "primary", size: "md", disabled: true },
  render: function DisabledStory(args) {
    const t = useTranslations("sb.button");
    return <Button {...args}>{args.children || t("disabled")}</Button>;
  },
};

/** Nút chỉ có icon: luôn kèm `aria-label` vì không còn chữ nào để đọc. */
export const IconButton: Story = {
  args: {
    variant: "outline",
    size: "icon",
    shape: "circle",
  },
  render: function IconButtonStory(args) {
    const t = useTranslations("sb.button");

    return (
      <Button {...args} aria-label={args["aria-label"] || t("search")}>
        <Icon icon={ICONS.search} />
      </Button>
    );
  },
};
