import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@noalhub/ui/button";
import { useTranslations } from "next-intl";
import {
  Alert,
  ALERT_TONES,
  type AlertTone,
} from "@noalhub/ui/alert";

const meta: Meta<typeof Alert> = {
  title: "UI/Elements/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    tone: {
      control: "select",
      options: ALERT_TONES,
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
type Story = StoryObj<typeof Alert>;

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
  const t = useTranslations("sb.alert");
  return (tone: AlertTone) => t(tone);
}

function ToneStory({ tone, message, ...rest }: Partial<React.ComponentProps<typeof Alert>> & { tone: AlertTone }) {
  const sample = useSample();
  return <Alert tone={tone} message={message ?? sample(tone)} {...rest} />;
}

export const ErrorAlert: Story = { args: { tone: "error" }, render: (args) => <ToneStory {...args} tone="error" /> };
export const SuccessAlert: Story = { args: { tone: "success" }, render: (args) => <ToneStory {...args} tone="success" /> };
export const InfoAlert: Story = { args: { tone: "info" }, render: (args) => <ToneStory {...args} tone="info" /> };
export const WarningAlert: Story = { args: { tone: "warning" }, render: (args) => <ToneStory {...args} tone="warning" /> };

/**
 * With `onDismiss` a close button appears; add `autoDismissMs` and it closes on
 * its own after that delay. Dismissal is a state change on the caller's side —
 * Alert only reports it.
 */
export const Dismissible: Story = {
  render: function DismissibleStory() {
    const t = useTranslations("sb.alert");
    const sample = useSample();
    const [tone, setTone] = useState<AlertTone | null>("info");
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert
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
      {ALERT_TONES.map((tone) => (
        <Alert key={tone} tone={tone} message={sample(tone)} />
      ))}
    </div>
    );
  },
};
