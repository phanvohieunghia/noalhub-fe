import type { Meta, StoryObj } from "@storybook/nextjs";
import { PostContent } from "@noalhub/ui/blog/post-content";
import type { BlogDoc } from "@noalhub/api/blog";

const meta: Meta<typeof PostContent> = {
  title: "UI/Blog/PostContent",
  component: PostContent,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof PostContent>;

const sampleBlogDoc: BlogDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Hướng dẫn cài đặt và sử dụng Storybook" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Storybook là một môi trường phát triển UI độc lập, giúp bạn xây dựng, kiểm thử và tài liệu hóa các component một cách trực quan mà không cần khởi động toàn bộ ứng dụng.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "1. Lợi ích khi sử dụng" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Phát triển độc lập (Isolated Development)" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Kiểm thử trực quan (Visual Regression Testing)" }],
            },
          ],
        },
      ],
    },
  ],
};

export const Default: Story = {
  args: {
    doc: sampleBlogDoc,
  },
};
