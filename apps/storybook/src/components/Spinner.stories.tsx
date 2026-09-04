import type { Meta, StoryObj } from "@storybook/nextjs";
import { Spinner, SPINNER_SIZES } from "@noalhub/ui/spinner";

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
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Playground: Story = {
  args: {
    size: "sm",
  },
};

/** Every size, iterated from the exported list. */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {SPINNER_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <Spinner size={size} />
          <code className="text-body-4 text-muted-foreground">{size}</code>
        </div>
      ))}
    </div>
  ),
};
