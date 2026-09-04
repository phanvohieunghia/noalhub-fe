import type { Meta, StoryObj } from "@storybook/nextjs";
import { Logo } from "@noalhub/ui/logo";

const meta: Meta<typeof Logo> = {
  title: "UI/Elements/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    className: {
      control: "text",
      description: "Class tuỳ biến kích thước (size-8, size-12, size-16)",
    },
    title: {
      control: "text",
      description: "Accessible name / aria-label",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {
    className: "size-10",
  },
};

export const Large: Story = {
  args: {
    className: "size-20",
    title: "Noalhub Brand Logo",
  },
};
