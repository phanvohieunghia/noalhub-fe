import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@noalhub/ui/dropdown-menu";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";

const meta: Meta<typeof DropdownMenu> = {
  title: "UI/Overlays/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu
      trigger={
        <Button variant="outline" size="sm">
          Tùy chọn <Icon icon={ICONS.chevronDown} />
        </Button>
      }
    >
      <DropdownMenuItem onSelect={() => alert("Sửa")}>
        <Icon icon={ICONS.edit} /> Sửa thông tin
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => alert("Sao chép")}>
        <Icon icon={ICONS.copy} /> Sao chép liên kết
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => alert("Xóa")} className="text-danger">
        <Icon icon={ICONS.delete} /> Xóa bài viết
      </DropdownMenuItem>
    </DropdownMenu>
  ),
};
