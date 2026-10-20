import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge, BADGE_SIZES, BADGE_TONES } from "@noalhub/ui/badge";
import { LUCIDE } from "@noalhub/ui/icons";

const meta: Meta<typeof Badge> = {
  title: "UI/Elements/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    tone: {
      control: "select",
      options: BADGE_TONES,
      description: "Màu sắc ngữ nghĩa của Badge",
    },
    size: {
      control: "select",
      options: BADGE_SIZES,
      description: "Kích thước: lg · md (mặc định) · sm",
    },
    children: {
      control: "text",
      description: "Nội dung hiển thị",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {
  args: {
    tone: "neutral",
    children: "Draft",
  },
};

/**
 * A realistic label per tone — a tone with no entry falls back to its own name,
 * so a tone added to `badge.tsx` still shows up here rather than being missed.
 */
const SAMPLE_LABELS: Partial<Record<(typeof BADGE_TONES)[number], string>> = {
  neutral: "Draft",
  success: "Active",
  warning: "Suspended",
  danger: "Banned",
  info: "New Feature",
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {BADGE_TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          {SAMPLE_LABELS[tone] ?? tone}
        </Badge>
      ))}
    </div>
  ),
};

/** Icon đứng trước nhãn — dùng cho số liệu ngắn như giới hạn context/output của model. */
export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-1">
      <Badge icon={LUCIDE.layers}>1M context</Badge>
      <Badge icon={LUCIDE.arrowUpFromLine}>64K output</Badge>
    </div>
  ),
};
