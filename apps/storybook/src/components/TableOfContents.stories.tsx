import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
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

/**
 * Tài liệu mẫu dựng trong một hook chứ không phải hằng số ở module scope: chữ
 * lấy từ `sb.toc` nên nó phụ thuộc ngôn ngữ đang chọn, mà module scope thì chưa
 * có locale nào cả.
 */
function useSampleDoc(): BlogDoc {
  const t = useTranslations("sb.toc");
  const heading = (level: 2 | 3, key: string) => ({
    type: "heading" as const,
    attrs: { level },
    content: [{ type: "text" as const, text: t(key) }],
  });

  return {
    type: "doc",
    content: [
      heading(2, "intro"),
      { type: "paragraph", content: [{ type: "text", text: t("introBody") }] },
      heading(2, "install"),
      heading(3, "deps"),
      heading(3, "config"),
      heading(2, "conclusion"),
    ],
  };
}

export const Default: Story = {
  render: function DefaultStory(args) {
    const doc = useSampleDoc();
    return <TableOfContents {...args} doc={doc} />;
  },
};
