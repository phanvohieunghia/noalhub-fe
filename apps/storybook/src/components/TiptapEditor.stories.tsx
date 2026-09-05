import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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

/**
 * Tài liệu mẫu dựng trong hook chứ không phải hằng số module scope: chữ lấy từ
 * `sb.tiptap` nên phụ thuộc ngôn ngữ, mà module scope chưa có locale.
 * Lệnh `pnpm …` và hai ký tự B/I giữ nguyên — chúng là mã và tên nút, không dịch.
 */
function useSampleDoc(): BlogDoc {
  const t = useTranslations("sb.tiptap");

  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: t("sampleTitle") }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: t("sampleBodyPre") },
          { type: "text", marks: [{ type: "bold" }], text: "B" },
          { type: "text", text: " / " },
          { type: "text", marks: [{ type: "italic" }], text: "I" },
          { type: "text", text: t("sampleBodyPost") },
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: t("hintImage") }] }],
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: t("hintLink") }] }],
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
}

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
    const sample = useSampleDoc();
    const [doc, setDoc] = useState<BlogDoc>(sample);
    return <TiptapEditor value={doc} onChange={setDoc} />;
  },
};

/**
 * `onChange` trả về JSON đã được `sanitizeBlogDoc` lọc — đúng thứ sẽ được lưu
 * xuống backend.
 */
export const WithJsonOutput: Story = {
  render: function JsonStory() {
    const tJson = useTranslations("sb.tiptap");
    const sample = useSampleDoc();
    const [doc, setDoc] = useState<BlogDoc>(sample);
    return (
      <div className="flex flex-col gap-3">
        <TiptapEditor value={doc} onChange={setDoc} />
        <Typography variant="title-4" as="h3">
          {tJson("jsonTitle")}
        </Typography>
        {/*
          `tabIndex={0}` + `role="region"` + nhãn: khối này cuộn được, mà một
          vùng cuộn không nhận được focus thì người dùng bàn phím không cách nào
          cuộn tới phần dưới (axe: `scrollable-region-focusable`). Đây là lý do
          story này từng đỏ trong `test-storybook`.
        */}
        <pre
          tabIndex={0}
          role="region"
          aria-label={tJson("jsonTitle")}
          className="max-h-64 overflow-auto rounded-md border border-border bg-muted p-3 text-body-4"
        >
          {JSON.stringify(doc, null, 2)}
        </pre>
      </div>
    );
  },
};
