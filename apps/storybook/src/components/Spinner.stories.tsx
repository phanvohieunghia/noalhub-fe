import type { Meta, StoryObj } from "@storybook/nextjs";
import { Spinner, SPINNER_SIZES, SPINNER_VARIANTS } from "@noalhub/ui/spinner";

const meta: Meta<typeof Spinner> = {
  title: "UI/Elements/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: SPINNER_SIZES,
      description: "Kích thước của vòng xoay",
    },
    variant: {
      control: "select",
      options: SPINNER_VARIANTS,
      description: "Kiểu hiển thị: vòng tròn, chấm, cột hay nhấp nháy",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Playground: Story = {
  args: {
    size: "md",
    variant: "ring",
  },
};

/** Mọi kiểu × mọi kích thước, lặp từ hai danh sách được export. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {SPINNER_VARIANTS.map((variant) => (
        <div key={variant} className="flex items-end gap-5">
          <code className="w-12 text-body-4 text-muted-foreground">{variant}</code>
          {SPINNER_SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <Spinner size={size} variant={variant} />
              <code className="text-body-4 text-muted-foreground">{size}</code>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Spinner ăn theo `currentColor`, nên nó tự hợp màu với chỗ đặt vào. */
export const InheritsColor: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <span className="flex items-center gap-2 text-primary">
        <Spinner variant="ring" /> primary
      </span>
      <span className="flex items-center gap-2 text-danger">
        <Spinner variant="dots" /> danger
      </span>
      <span className="flex items-center gap-2 text-muted-foreground">
        <Spinner variant="bars" /> muted
      </span>
    </div>
  ),
};
