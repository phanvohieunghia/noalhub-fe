import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { PaginationLinks } from "@noalhub/ui/pagination-links";

/**
 * The crawlable pagination for public pages: real `<a href>`s, unlike
 * `Pagination`, which is a client component driven by `onPageChange`.
 */
const meta: Meta<typeof PaginationLinks> = {
  title: "UI/Navigation/PaginationLinks",
  component: PaginationLinks,
  parameters: { layout: "padded" },
  args: {
    basePath: "/blogs",
    page: 2,
    limit: 10,
    total: 95,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PaginationLinks>;

export const Middle: Story = {};

/** On page 1 the "previous" link becomes a plain `<span>` — no link to page 0. */
export const FirstPage: Story = {
  args: { page: 1 },
};

export const LastPage: Story = {
  args: { page: 10 },
};

/** A single page renders nothing at all. */
export const SinglePage: Story = {
  args: { page: 1, total: 8 },
};
