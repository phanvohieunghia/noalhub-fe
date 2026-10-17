import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BottomNav, type BottomNavItem } from "@noalhub/ui/bottom-nav";
import { LUCIDE } from "@noalhub/ui/icons";

const ITEMS: BottomNavItem[] = [
  { key: "posts", label: "Posts", icon: LUCIDE.newspaper, href: "/blogs" },
  { key: "practice", label: "Practice", icon: LUCIDE.graduationCap, href: "/learn" },
  { key: "chat", label: "Chat", icon: LUCIDE.messageCircle, href: "/chat" },
  { key: "profile", label: "Profile", icon: LUCIDE.userRound, href: "/profile" },
];

/** Mobile primary navigation; the active item is tinted with the accent color. */
const meta: Meta<typeof BottomNav> = {
  title: "UI/Navigation/BottomNav",
  component: BottomNav,
  parameters: { layout: "padded" },
  args: { items: ITEMS, activeKey: "practice", label: "Main navigation" },
  argTypes: {
    activeKey: { control: "select", options: ITEMS.map((i) => i.key) },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

export const Playground: Story = {};

export const NoneActive: Story = { args: { activeKey: undefined } };

/** The Chat item is dimmed and not clickable, e.g. while signed out. */
export const ChatDisabled: Story = {
  args: {
    items: ITEMS.map((item) => (item.key === "chat" ? { ...item, disabled: true } : item)),
  },
};
