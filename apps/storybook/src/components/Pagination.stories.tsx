import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
import { Pagination } from "@noalhub/ui/pagination";

const meta: Meta<typeof Pagination> = {
  title: "UI/Navigation/Pagination",
  component: Pagination,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Interactive: Story = {
  render: () => {
    const [page, setPage] = useState(1);

    return (
      <div className="w-full max-w-xl">
        <Pagination
          page={page}
          limit={10}
          total={95}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <Pagination page={1} limit={10} total={0} onPageChange={() => {}} />
    </div>
  ),
};
