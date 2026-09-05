import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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

/*
 * Tên mẫu lấy từ namespace `sb`: `args.name ||` giữ nguyên ô Controls (gõ vào là
 * đè), để trống thì lấy tên đã dịch theo toolbar. Bản `en` dùng tên tiếng Anh —
 * initials sinh ra khác nhau, và đó chính là thứ đáng nhìn ở component này.
 */
export const WithImage: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    size: "md",
  },
  render: function WithImageStory(args) {
    const t = useTranslations("sb.avatar");
    return <Avatar {...args} name={args.name || t("personA")} />;
  },
};

/** No `src`: Radix falls back to the initials of the first two words. */
export const FallbackInitials: Story = {
  args: { size: "md" },
  render: function FallbackStory(args) {
    const t = useTranslations("sb.avatar");
    return <Avatar {...args} name={args.name || t("personC")} />;
  },
};

/** Every size, iterated from the exported list. */
export const AllSizes: Story = {
  render: function AllSizesStory() {
    const t = useTranslations("sb.avatar");

    return (
    <div className="flex items-end gap-4">
      {AVATAR_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <Avatar name={t("personB")} size={size} />
          <code className="text-body-4 text-muted-foreground">{size}</code>
        </div>
      ))}
      </div>
    );
  },
};
