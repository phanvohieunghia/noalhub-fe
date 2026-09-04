import type { Meta, StoryObj } from "@storybook/nextjs";
import { Skeleton } from "@noalhub/ui/skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Elements/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ),
};

export const AvatarCard: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  ),
};
