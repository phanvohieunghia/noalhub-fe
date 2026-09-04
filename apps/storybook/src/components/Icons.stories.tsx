import type { Meta, StoryObj } from "@storybook/nextjs";
import { Icon, ICONS } from "@noalhub/ui/icons";

const meta: Meta<typeof Icon> = {
  title: "UI/Data Display/Icons",
  component: Icon,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
      {Object.entries(ICONS).map(([name, iconName]) => (
        <div
          key={name}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 text-center hover:bg-muted"
        >
          <Icon icon={iconName} className="size-6 text-foreground" />
          <span className="text-body-4 opacity-70">{name}</span>
        </div>
      ))}
    </div>
  ),
};
