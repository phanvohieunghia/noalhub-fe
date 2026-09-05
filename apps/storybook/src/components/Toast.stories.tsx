import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Button } from "@noalhub/ui/button";
import { useTranslations } from "next-intl";
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

/**
 * Câu mẫu cho từng sắc thái, lấy theo ngôn ngữ đang chọn trên toolbar.
 *
 * `message` vẫn nằm trong `args` như một control: `args.message ?? sample(tone)`
 * nghĩa là gõ vào ô Controls thì đè được, còn để trống thì lấy câu mẫu đã dịch.
 * Bỏ hẳn `args.message` thì control trở nên vô dụng; hardcode câu mẫu thì đổi
 * ngôn ngữ không ăn. Cách này giữ được cả hai.
 */
function useSample() {
  const t = useTranslations("sb.toast");
  return (tone: ToastTone) => t(tone);
}

function ToneStory({ tone, message, ...rest }: Partial<React.ComponentProps<typeof Toast>> & { tone: ToastTone }) {
  const sample = useSample();
  return <Toast tone={tone} message={message ?? sample(tone)} {...rest} />;
}

export const ErrorAlert: Story = { args: { tone: "error" }, render: (args) => <ToneStory {...args} tone="error" /> };
export const SuccessAlert: Story = { args: { tone: "success" }, render: (args) => <ToneStory {...args} tone="success" /> };
export const InfoAlert: Story = { args: { tone: "info" }, render: (args) => <ToneStory {...args} tone="info" /> };
export const WarningAlert: Story = { args: { tone: "warning" }, render: (args) => <ToneStory {...args} tone="warning" /> };

/**
 * Có `onDismiss` thì hiện nút đóng; thêm `autoDismissMs` thì tự tắt sau đó.
 * Việc đóng là đổi state của phía gọi — Toast chỉ báo ra.
 */
export const Dismissible: Story = {
  render: function DismissibleStory() {
    const t = useTranslations("sb.toast");
    const sample = useSample();
    const [tone, setTone] = useState<ToastTone | null>("info");
    return (
      <div className="flex flex-col items-start gap-3">
        <Toast
          tone={tone ?? "info"}
          message={tone ? sample(tone) : null}
          onDismiss={() => setTone(null)}
          autoDismissMs={4000}
        />
        {tone ? null : (
          <Button variant="outline" onClick={() => setTone("info")}>
            {t("showAgain")}
          </Button>
        )}
      </div>
    );
  },
};

/** Cả bốn sắc thái cạnh nhau để so màu. */
export const AllTones: Story = {
  render: function AllTonesStory() {
    const sample = useSample();

    return (
    <div className="flex flex-col gap-3">
      {TOAST_TONES.map((tone) => (
        <Toast key={tone} tone={tone} message={sample(tone)} />
      ))}
    </div>
    );
  },
};
