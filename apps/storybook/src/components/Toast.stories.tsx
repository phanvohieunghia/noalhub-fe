import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
 * A sample sentence per tone, taken from the language selected in the toolbar.
 *
 * `message` stays in `args` as a control: `args.message ?? sample(tone)` means
 * typing into the Controls field overrides it, while leaving it empty falls back
 * to the translated sample. Dropping `args.message` entirely would make the
 * control useless; hardcoding the sample would make the language switch a no-op.
 * This keeps both.
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
 * With `onDismiss` a close button appears; add `autoDismissMs` and it closes on
 * its own after that delay. Dismissal is a state change on the caller's side —
 * Toast only reports it.
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

/** All four tones side by side to compare their colors. */
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
