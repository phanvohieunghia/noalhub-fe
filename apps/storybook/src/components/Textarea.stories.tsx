import type { Meta, StoryObj } from "@storybook/nextjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Textarea, TEXTAREA_RESIZE } from "@noalhub/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Elements/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: { control: "text", description: "Nhãn hiển thị phía trên textarea" },
    error: { control: "text", description: "Thông báo lỗi bên dưới textarea" },
    hint: { control: "text", description: "Chú thích, ẩn đi khi đang có lỗi" },
    placeholder: { control: "text", description: "Placeholder gợi ý" },
    rows: { control: "number", description: "Số hàng ban đầu" },
    resize: {
      control: "inline-radio",
      options: TEXTAREA_RESIZE,
      description: "none: cố định · vertical: kéo tay · auto: tự giãn theo nội dung",
    },
    maxRows: { control: "number", description: "Trần chiều cao khi resize=auto" },
    showCount: { control: "boolean", description: "Đếm ký tự ở góc phải" },
    maxLength: { control: "number", description: "Giới hạn ký tự" },
    disabled: { control: "boolean", description: "Trạng thái vô hiệu hóa" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

/*
 * Chữ mẫu lấy từ `sb.textarea`; `args.x ||` giữ ô Controls gõ đè được.
 */
export const Default: Story = {
  args: { rows: 4 },
  render: function DefaultStory(args) {
    const t = useTranslations("sb.textarea");

    return (
      <Textarea
        {...args}
        label={args.label || t("desc")}
        placeholder={args.placeholder || t("descPlaceholder")}
      />
    );
  },
};

/** Mặc định `vertical`: kéo được mép dưới để nới cao. */
export const Resizable: Story = {
  args: { resize: "vertical", rows: 3 },
  render: function ResizableStory(args) {
    const t = useTranslations("sb.textarea");

    return (
      <Textarea
        {...args}
        label={args.label || t("resizeLabel")}
        hint={args.hint || t("resizeHint")}
      />
    );
  },
};

/** `resize="auto"`: gõ tới đâu cao tới đó, chạm `maxRows` thì chuyển sang cuộn. */
export const AutoGrow: Story = {
  render: function AutoGrowStory() {
    const t = useTranslations("sb.textarea");
    const [value, setValue] = useState(t("autoGrowValue"));
    return (
      <Textarea
        label={t("autoGrow")}
        resize="auto"
        maxRows={8}
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        hint={t("autoGrowHint")}
      />
    );
  },
};

/** Đếm ký tự, và đổi sang màu danger khi vượt `maxLength`. */
export const WithCounter: Story = {
  render: function CounterStory() {
    const t = useTranslations("sb.textarea");
    const [value, setValue] = useState(t("summaryValue"));
    return (
      <Textarea
        label={t("summary")}
        showCount
        maxLength={160}
        resize="auto"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        hint={t("summaryHint")}
      />
    );
  },
};

export const WithHint: Story = {
  args: { rows: 3 },
  render: function WithHintStory(args) {
    const t = useTranslations("sb.textarea");

    return (
      <Textarea {...args} label={args.label || t("note")} hint={args.hint || t("notePlaceholder")} />
    );
  },
};

export const WithError: Story = {
  args: { showCount: true, maxLength: 200, rows: 3 },
  render: function WithErrorStory(args) {
    const t = useTranslations("sb.textarea");

    return (
      <Textarea
        {...args}
        label={args.label || t("rejectLabel")}
        placeholder={args.placeholder || t("rejectPlaceholder")}
        hint={args.hint || t("hiddenHint")}
        error={args.error || t("rejectError")}
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, rows: 3 },
  render: function DisabledStory(args) {
    const t = useTranslations("sb.textarea");

    return (
      <Textarea {...args} label={args.label || t("readonlyLabel")} value={args.value || t("readonlyValue")} />
    );
  },
};

/**
 * `rows` quyết định chiều cao ban đầu (mặc định 3). Với `resize="auto"` nó chỉ
 * là mức sàn — ô vẫn cao lên theo nội dung.
 */
export const Rows: Story = {
  render: function RowsStory() {
    const t = useTranslations("sb.textarea");

    return (
      <div className="flex flex-col gap-5">
        {[1, 3, 6, 10].map((rows) => (
          <Textarea
            key={rows}
            label={`rows={${rows}}`}
            rows={rows}
            resize="none"
            placeholder={t("rowsPlaceholder", { rows })}
          />
        ))}
      </div>
    );
  },
};

/** Ba kiểu resize cạnh nhau. */
export const AllResizeModes: Story = {
  render: function AllResizeModesStory() {
    const t = useTranslations("sb.textarea");

    return (
      <div className="flex flex-col gap-5">
      {TEXTAREA_RESIZE.map((mode) => (
        <Textarea
          key={mode}
          label={`resize="${mode}"`}
          resize={mode}
          rows={2}
          defaultValue={
            mode === "auto"
              ? t("hintAuto")
              : mode === "vertical"
                ? t("hintResize")
                : t("hintFixed")
          }
        />
      ))}
      </div>
    );
  },
};
