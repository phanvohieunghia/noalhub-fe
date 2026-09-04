import type { Meta, StoryObj } from "@storybook/nextjs";
import { Avatar, AVATAR_SIZES } from "@noalhub/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Data Display/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    name: {
      control: "text",
      description: "Tên người dùng để sinh initials (fallback)",
    },
    src: {
      control: "text",
      description: "Đường dẫn URL của ảnh đại diện",
    },
    size: {
      control: "select",
      options: AVATAR_SIZES,
      description: "Kích thước Avatar",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    name: "Nguyễn Văn A",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    size: "md",
  },
};

/** No `src`: Radix falls back to the initials of the first two words. */
export const FallbackInitials: Story = {
  args: {
    name: "Phan Võ Hiếu Nghĩa",
    size: "md",
  },
};

/** Every size, iterated from the exported list. */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {AVATAR_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <Avatar name="Nguyễn An" size={size} />
          <code className="text-body-4 text-muted-foreground">{size}</code>
        </div>
      ))}
    </div>
  ),
};
