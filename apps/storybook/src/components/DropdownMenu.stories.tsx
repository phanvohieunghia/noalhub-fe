import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@noalhub/ui/dropdown-menu";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { useTranslations } from "next-intl";

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
  render: function DropdownStory() {
    const t = useTranslations("sb.dropdown");

    return (
      <DropdownMenu
        trigger={
          <Button variant="outline" size="sm">
            {t("trigger")} <Icon icon={ICONS.chevronDown} />
          </Button>
        }
      >
        <DropdownMenuItem icon={ICONS.edit} onSelect={() => alert(t("edit"))}>
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem icon={ICONS.copy} onSelect={() => alert(t("copy"))}>
          {t("copy")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={ICONS.delete} tone="danger" onSelect={() => alert(t("delete"))}>
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenu>
    );
  },
};
