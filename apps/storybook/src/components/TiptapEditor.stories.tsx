import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { BlogDoc } from "@noalhub/api/blog";
import { TiptapEditor } from "@noalhub/ui/blog/tiptap-editor";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { Typography } from "@noalhub/ui/typography";

/**
 * The post editor (Tiptap), configured with the blog's allowed node list. Image
 * upload goes through `useUploadMedia`, so in Storybook (no backend) the image
 * button reports an upload error — the editing itself still works normally.
 */
const meta: Meta<typeof TiptapEditor> = {
  title: "UI/Blog/TiptapEditor",
  component: TiptapEditor,
  parameters: {
    layout: "padded",
  },
  // `useUploadMedia` is a React Query mutation, so a provider is required.
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
 * The sample document is built inside a hook rather than as a module-scope
 * constant: its text comes from `sb.tiptap` and therefore depends on the language,
 * and at module scope there is no locale yet. The `pnpm …` command and the B/I
 * characters stay as they are — they are code and button names, not copy.
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

/** Starting from an empty document. */
export const Empty: Story = {
  render: function EmptyStory() {
    const [doc, setDoc] = useState<BlogDoc>(EMPTY);
    return <TiptapEditor value={doc} onChange={setDoc} />;
  },
};

/** Pre-filled with sample content so the toolbar buttons can be tried out. */
export const WithContent: Story = {
  render: function WithContentStory() {
    const sample = useSampleDoc();
    const [doc, setDoc] = useState<BlogDoc>(sample);
    return <TiptapEditor value={doc} onChange={setDoc} />;
  },
};

/**
 * `onChange` returns JSON already filtered by `sanitizeBlogDoc` — exactly what
 * gets persisted to the backend.
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
