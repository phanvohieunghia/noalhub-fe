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
  render: function InteractiveStory() {
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

/** Nhiều trang: cửa sổ số trang rút gọn bằng dấu "…" ở hai đầu. */
export const ManyPages: Story = {
  render: function ManyPagesStory() {
    const [page, setPage] = useState(8);

    return (
      <div className="w-full max-w-xl">
        <Pagination page={page} limit={10} total={1240} onPageChange={setPage} />
      </div>
    );
  },
};

/** Đang tải trang mới: mọi nút khoá lại để click không dồn. */
export const Loading: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <Pagination page={3} limit={10} total={95} onPageChange={() => {}} isLoading />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <Pagination page={1} limit={10} total={0} onPageChange={() => {}} />
    </div>
  ),
};
