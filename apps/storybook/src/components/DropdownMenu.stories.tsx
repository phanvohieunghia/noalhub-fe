import type { Meta, StoryObj } from "@storybook/nextjs";
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
        <DropdownMenuItem onSelect={() => alert(t("edit"))}>
          <Icon icon={ICONS.edit} /> {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => alert(t("copy"))}>
          <Icon icon={ICONS.copy} /> {t("copy")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => alert(t("delete"))} className="text-danger">
          <Icon icon={ICONS.delete} /> {t("delete")}
        </DropdownMenuItem>
      </DropdownMenu>
    );
  },
};
