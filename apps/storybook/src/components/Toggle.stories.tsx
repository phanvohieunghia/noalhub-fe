import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { LUCIDE } from "@noalhub/ui/icons";
import { Toggle } from "@noalhub/ui/toggle";

const OPTIONS = [
  { value: "list", icon: LUCIDE.layoutList, label: "List view" },
  { value: "grid", icon: LUCIDE.layoutGrid, label: "Grid view" },
] as const;

const meta: Meta<typeof Toggle> = {
  title: "UI/Elements/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
  argTypes: {
    disabled: { control: "boolean", description: "Trạng thái vô hiệu hóa" },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const ViewToggle: Story = {
  render: (args) => {
    const [view, setView] = useState<"list" | "grid">("list");
    return (
      <Toggle
        {...args}
        aria-label="View mode"
        options={OPTIONS}
        value={view}
        onValueChange={setView}
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Toggle {...args} aria-label="View mode" options={OPTIONS} value="grid" onValueChange={() => {}} />
  ),
};
