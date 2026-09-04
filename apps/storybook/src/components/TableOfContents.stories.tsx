import type { Meta, StoryObj } from "@storybook/nextjs";
import { TableOfContents } from "@noalhub/ui/blog/table-of-contents";
import type { BlogDoc } from "@noalhub/api/blog";

const meta: Meta<typeof TableOfContents> = {
  title: "UI/Blog/TableOfContents",
  component: TableOfContents,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof TableOfContents>;

const sampleBlogDocWithHeadings: BlogDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "1. Giới thiệu tổng quan" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Nội dung giới thiệu..." }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "2. Hướng dẫn cài đặt" }],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "2.1. Cài đặt dependencies" }],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "2.2. Cấu hình Storybook" }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "3. Kết luận" }],
    },
  ],
};

export const Default: Story = {
  args: {
    doc: sampleBlogDocWithHeadings,
  },
};
