import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import type { BlogDoc } from "@noalhub/api/blog";
import { TiptapEditor } from "@noalhub/ui/blog/tiptap-editor";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { Typography } from "@noalhub/ui/typography";

/**
 * Trình soạn thảo bài viết (Tiptap), cấu hình đúng danh sách node được phép của
 * blog. Upload ảnh đi qua `useUploadMedia`, nên trong Storybook (không có
 * backend) nút "Ảnh" sẽ báo lỗi tải lên — phần soạn thảo vẫn dùng bình thường.
 */
const meta: Meta<typeof TiptapEditor> = {
  title: "UI/Blog/TiptapEditor",
  component: TiptapEditor,
  parameters: {
    layout: "padded",
  },
  // `useUploadMedia` là một mutation của React Query, phải có provider.
  decorators: [
    (Story) => (
      <QueryProvider>
        <Story />
      </QueryProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TiptapEditor>;

const EMPTY: BlogDoc = { type: "doc", content: [{ type: "paragraph" }] };

const SAMPLE: BlogDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Bắt đầu với Storybook" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Chọn một đoạn rồi bấm " },
        { type: "text", marks: [{ type: "bold" }], text: "B" },
        { type: "text", text: " / " },
        { type: "text", marks: [{ type: "italic" }], text: "I" },
        { type: "text", text: " trên thanh công cụ để xem trạng thái active." },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Kéo–thả ảnh vào vùng soạn thảo" }] },
          ],
        },
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Dán link rồi bấm nút Link" }] },
          ],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "bash" },
      content: [{ type: "text", text: "pnpm --filter @noalhub/storybook dev" }],
    },
  ],
};

/** Bắt đầu từ một tài liệu rỗng. */
export const Empty: Story = {
  render: function EmptyStory() {
    const [doc, setDoc] = useState<BlogDoc>(EMPTY);
    return <TiptapEditor value={doc} onChange={setDoc} />;
  },
};

/** Có sẵn nội dung mẫu để thử các nút trên thanh công cụ. */
export const WithContent: Story = {
  render: function WithContentStory() {
    const [doc, setDoc] = useState<BlogDoc>(SAMPLE);
    return <TiptapEditor value={doc} onChange={setDoc} />;
  },
};

/**
 * `onChange` trả về JSON đã được `sanitizeBlogDoc` lọc — đúng thứ sẽ được lưu
 * xuống backend.
 */
export const WithJsonOutput: Story = {
  render: function JsonStory() {
    const [doc, setDoc] = useState<BlogDoc>(SAMPLE);
    return (
      <div className="flex flex-col gap-3">
        <TiptapEditor value={doc} onChange={setDoc} />
        <Typography variant="title-4" as="h3">
          JSON sẽ được lưu
        </Typography>
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted p-3 text-body-4">
          {JSON.stringify(doc, null, 2)}
        </pre>
      </div>
    );
  },
};
