import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { ThemeProvider } from "@noalhub/ui/theme/theme-provider";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";

/**
 * `ThemeToggle` reads its state from `ThemeProvider`, which is mounted in each
 * app's root layout — the story has to provide it as well.
 *
 * Note: clicking here writes `localStorage` and puts the `dark` class on
 * `<html>` exactly as in the real app, so it competes with the theme switch in
 * the toolbar. The last one clicked wins.
 */
const meta: Meta<typeof ThemeToggle> = {
  title: "UI/Theme/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};

export const OnSurface: Story = {
  render: () => (
    <div className="rounded-xl bg-surface p-6">
      <ThemeToggle />
    </div>
  ),
};
