import type { Meta, StoryObj } from "@storybook/nextjs";
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

export const Default: Story = {
  args: {
    label: "Mô tả nội dung",
    placeholder: "Nhập mô tả chi tiết tại đây...",
    rows: 4,
  },
};

/** Mặc định `vertical`: kéo được mép dưới để nới cao. */
export const Resizable: Story = {
  args: {
    label: "Kéo mép dưới để nới ra",
    resize: "vertical",
    rows: 3,
    hint: "Góc phải dưới có tay cầm để kéo.",
  },
};

/** `resize="auto"`: gõ tới đâu cao tới đó, chạm `maxRows` thì chuyển sang cuộn. */
export const AutoGrow: Story = {
  render: function AutoGrowStory() {
    const [value, setValue] = useState(
      "Gõ thêm vài dòng để thấy ô tự cao lên.\nĐến khi chạm trần thì nó dừng và cuộn bên trong.",
    );
    return (
      <Textarea
        label="Tự giãn theo nội dung"
        resize="auto"
        maxRows={8}
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        hint="Trần ở đây là 8 dòng."
      />
    );
  },
};

/** Đếm ký tự, và đổi sang màu danger khi vượt `maxLength`. */
export const WithCounter: Story = {
  render: function CounterStory() {
    const [value, setValue] = useState("Tóm tắt ngắn cho bài viết.");
    return (
      <Textarea
        label="Tóm tắt"
        showCount
        maxLength={160}
        resize="auto"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        hint="Google thường cắt phần vượt quá ~160 ký tự."
      />
    );
  },
};

export const WithHint: Story = {
  args: {
    label: "Ghi chú nội bộ",
    hint: "Chỉ quản trị viên nhìn thấy, không hiển thị ra ngoài trang công khai.",
    rows: 3,
  },
};

export const WithError: Story = {
  args: {
    label: "Lý do từ chối",
    placeholder: "Nhập lý do...",
    hint: "Chú thích này bị ẩn khi có lỗi.",
    error: "Lý do không được để trống khi từ chối.",
    showCount: true,
    maxLength: 200,
    rows: 3,
  },
};

export const Disabled: Story = {
  args: {
    label: "Nội dung chỉ đọc",
    value: "Nội dung này không thể chỉnh sửa.",
    disabled: true,
    rows: 3,
  },
};

/**
 * `rows` quyết định chiều cao ban đầu (mặc định 3). Với `resize="auto"` nó chỉ
 * là mức sàn — ô vẫn cao lên theo nội dung.
 */
export const Rows: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {[1, 3, 6, 10].map((rows) => (
        <Textarea
          key={rows}
          label={`rows={${rows}}`}
          rows={rows}
          resize="none"
          placeholder={`Ô cao ${rows} dòng`}
        />
      ))}
    </div>
  ),
};

/** Ba kiểu resize cạnh nhau. */
export const AllResizeModes: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {TEXTAREA_RESIZE.map((mode) => (
        <Textarea
          key={mode}
          label={`resize="${mode}"`}
          resize={mode}
          rows={2}
          defaultValue={
            mode === "auto"
              ? "Ô này tự cao lên khi nội dung dài ra."
              : mode === "vertical"
                ? "Ô này kéo tay được."
                : "Ô này cố định chiều cao."
          }
        />
      ))}
    </div>
  ),
};
