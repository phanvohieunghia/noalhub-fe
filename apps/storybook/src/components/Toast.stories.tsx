import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { Button } from "@noalhub/ui/button";
import { ToastHost, toast, type ToastTone } from "@noalhub/ui/toast";

/**
 * The floating sibling of `Alert`. `Alert` sits in the layout and stays; a toast
 * floats over the page, stacks with its neighbours and expires on its own.
 *
 * Every story mounts `<ToastHost />` — in the apps it is mounted once in the
 * root layout and the `toast.*` calls come from anywhere.
 */
const meta: Meta<typeof ToastHost> = {
  title: "UI/Feedback/Toast",
  component: ToastHost,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ToastHost>;

const TONES: ToastTone[] = ["success", "error", "info", "warning"];

/** One button per tone. Fire several in a row to see them stack. */
export const Tones: Story = {
  render: function TonesStory() {
    const t = useTranslations("sb.toast");
    const common = useTranslations("common");

    return (
      <>
        <ToastHost closeLabel={common("actions.close")} />
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Button key={tone} variant="outline" onClick={() => toast[tone](t(tone))}>
              {tone}
            </Button>
          ))}
        </div>
      </>
    );
  },
};

/**
 * The queue is the reason this one is a library and not hand-written: toasts
 * stack, reorder as one expires, and the timers pause while the pointer is over
 * them.
 */
export const Stacking: Story = {
  render: function StackingStory() {
    const t = useTranslations("sb.toast");
    const common = useTranslations("common");

    return (
      <>
        <ToastHost closeLabel={common("actions.close")} />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              TONES.forEach((tone, index) => {
                setTimeout(() => toast[tone](t(tone)), index * 400);
              });
            }}
          >
            {t("fireAll")}
          </Button>
          <Button variant="outline" onClick={() => toast.dismiss()}>
            {t("dismissAll")}
          </Button>
        </div>
      </>
    );
  },
};

/**
 * `error` lives longer than the rest (6s vs 4s) — it is the one worth reading
 * twice — and announces itself assertively instead of waiting for a pause.
 */
export const Duration: Story = {
  render: function DurationStory() {
    const t = useTranslations("sb.toast");
    const common = useTranslations("common");

    return (
      <>
        <ToastHost closeLabel={common("actions.close")} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success(t("shortLived"))}>
            {t("default4s")}
          </Button>
          <Button variant="outline" onClick={() => toast.error(t("longLived"))}>
            {t("error6s")}
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info(t("sticky"), { duration: Infinity })}
          >
            {t("stickyLabel")}
          </Button>
        </div>
      </>
    );
  },
};

/** Long copy wraps inside a capped width instead of stretching across the page. */
export const LongMessage: Story = {
  render: function LongMessageStory() {
    const t = useTranslations("sb.toast");
    const common = useTranslations("common");

    return (
      <>
        <ToastHost closeLabel={common("actions.close")} />
        <Button variant="outline" onClick={() => toast.warning(t("long"))}>
          {t("longLabel")}
        </Button>
      </>
    );
  },
};
