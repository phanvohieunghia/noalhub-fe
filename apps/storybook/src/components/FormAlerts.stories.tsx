import type { Meta, StoryObj } from "@storybook/nextjs";
import { FormError, FormSuccess } from "@noalhub/ui/form-error";

const meta: Meta<typeof FormError> = {
  title: "UI/Elements/FormAlerts",
  component: FormError,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    message: {
      control: "text",
      description: "Nội dung thông báo lỗi",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormError>;

export const ErrorAlert: Story = {
  args: {
    message: "Đã xảy ra lỗi hệ thống hoặc bạn đã nhập sai mật khẩu.",
  },
};

export const SuccessAlert: StoryObj<typeof FormSuccess> = {
  render: () => <FormSuccess message="Cập nhật thông tin thành công!" />,
};
