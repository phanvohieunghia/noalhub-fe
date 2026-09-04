import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Button } from "@noalhub/ui/button";
import { NavigationProgress } from "@noalhub/ui/navigation-progress";

/**
 * The bar is driven by real route transitions, which do not happen inside
 * Storybook — so the story starts it the same way the component does for
 * back/forward: a `popstate` event. Nothing here completes the navigation, so
 * the bar climbs towards its 90% ceiling and disappears on the 15s safety net.
 */
const meta: Meta<typeof NavigationProgress> = {
  title: "UI/Feedback/NavigationProgress",
  component: NavigationProgress,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof NavigationProgress>;

export const Demo: Story = {
  render: () => (
    <div className="relative flex min-h-40 flex-col items-start gap-4 overflow-hidden rounded-xl border border-border p-6">
      <NavigationProgress className="absolute inset-x-0 top-0" />
      <p className="text-body-3 text-muted-foreground">
        In the real app the bar is `fixed` at the top of the viewport; here it is
        pinned to this box so it stays visible.
      </p>
      <Button onClick={() => window.dispatchEvent(new PopStateEvent("popstate"))}>
        Start
      </Button>
    </div>
  ),
};
