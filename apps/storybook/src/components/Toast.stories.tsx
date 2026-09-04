import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Button } from "@noalhub/ui/button";
import {
  Toast,
  TOAST_TONES,
  type ToastTone,
} from "@noalhub/ui/toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Elements/Toast",
  component: Toast,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    tone: {
      control: "select",
      options: TOAST_TONES,
      description: "Sắc thái của thông báo",
    },
    message: {
      control: "text",
      description: "Nội dung thông báo",
    },
    autoDismissMs: {
      control: "number",
      description: "Tự tắt sau bao nhiêu ms (cần có onDismiss)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

const SAMPLE: Record<ToastTone, string> = {
  error: "Đã xảy ra lỗi hệ thống hoặc bạn đã nhập sai mật khẩu.",
  success: "Cập nhật thông tin thành công!",
  info: "Bản nháp được lưu trên máy bạn cho tới khi bấm Lưu.",
  warning: "Bài viết chưa có ảnh bìa — mạng xã hội sẽ hiển thị link trống.",
};

export const ErrorAlert: Story = { args: { tone: "error", message: SAMPLE.error } };
export const SuccessAlert: Story = { args: { tone: "success", message: SAMPLE.success } };
export const InfoAlert: Story = { args: { tone: "info", message: SAMPLE.info } };
export const WarningAlert: Story = { args: { tone: "warning", message: SAMPLE.warning } };

/**
 * Có `onDismiss` thì hiện nút đóng; thêm `autoDismissMs` thì tự tắt sau đó.
 * Việc đóng là đổi state của phía gọi — Toast chỉ báo ra.
 */
export const Dismissible: Story = {
  render: function DismissibleStory() {
    const [tone, setTone] = useState<ToastTone | null>("info");
    return (
      <div className="flex flex-col items-start gap-3">
        <Toast
          tone={tone ?? "info"}
          message={tone ? SAMPLE[tone] : null}
          onDismiss={() => setTone(null)}
          autoDismissMs={4000}
        />
        {tone ? null : (
          <Button variant="outline" onClick={() => setTone("info")}>
            Hiện lại
          </Button>
        )}
      </div>
    );
  },
};

/** Cả bốn sắc thái cạnh nhau để so màu. */
export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {TOAST_TONES.map((tone) => (
        <Toast key={tone} tone={tone} message={SAMPLE[tone]} />
      ))}
    </div>
  ),
};
