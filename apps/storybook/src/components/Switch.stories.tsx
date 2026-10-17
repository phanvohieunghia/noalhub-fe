import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Switch } from "@noalhub/ui/switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Elements/Switch",
  component: Switch,
  parameters: { layout: "padded" },
  argTypes: {
    label: { control: "text", description: "Nhãn nằm bên phải công tắc" },
    checked: { control: "boolean", description: "Trạng thái bật/tắt" },
    loading: { control: "boolean", description: "Đang chờ kết quả; hiện spinner và khóa lại" },
    disabled: { control: "boolean", description: "Trạng thái vô hiệu hóa" },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: { label: "Published" },
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return <Switch {...args} checked={checked} onCheckedChange={setChecked} />;
  },
};

export const On: Story = { args: { label: "Published", checked: true } };

export const Loading: Story = { args: { label: "Published", checked: true, loading: true } };

export const Disabled: Story = { args: { label: "Published", disabled: true } };
