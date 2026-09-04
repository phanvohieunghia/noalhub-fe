import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
import { LanguageSwitcher } from "@noalhub/ui/language-switcher";
import { QueryProvider } from "@noalhub/ui/query-provider";

/**
 * The active language comes from `NextIntlClientProvider` — use the globe in
 * the toolbar to change it.
 *
 * `onSwitch` is where each app puts its own navigation (web has a locale prefix
 * in the URL, admin does not), so the story only logs it. Behind the scenes the
 * component still calls `PATCH /users/me/language`; with no backend running the
 * request simply fails and is swallowed, which is the signed-out path.
 */
const meta: Meta<typeof LanguageSwitcher> = {
  title: "UI/Navigation/LanguageSwitcher",
  component: LanguageSwitcher,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <QueryProvider>
        <Story />
      </QueryProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LanguageSwitcher>;

export const Default: Story = {
  args: {
    onSwitch: () => {},
  },
};

/** Shows what the call site receives when a language is picked. */
export const WithCallback: Story = {
  render: () => {
    const [picked, setPicked] = useState<string | null>(null);

    return (
      <div className="flex flex-col items-center gap-3">
        <LanguageSwitcher onSwitch={(locale) => setPicked(locale)} />
        <p className="text-body-3 text-muted-foreground">
          onSwitch: {picked ?? "—"}
        </p>
      </div>
    );
  },
};
