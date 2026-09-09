import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Checkbox, CHECKBOX_SIZES } from "@noalhub/ui/checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Elements/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    label: { control: "text", description: "Nhãn nằm bên phải ô" },
    hint: { control: "text", description: "Chú thích, ẩn đi khi đang có lỗi" },
    error: { control: "text", description: "Thông báo lỗi bên dưới" },
    size: {
      control: "inline-radio",
      options: CHECKBOX_SIZES,
      description: "sm: bảng, bộ lọc · md: form (thẳng hàng với Input)",
    },
    checked: {
      control: "inline-radio",
      options: [true, false, "indeterminate"],
      description: 'Trạng thái; "indeterminate" hiện dấu gạch',
    },
    loading: {
      control: "boolean",
      description: "Đang chờ kết quả; hiện spinner và khóa ô lại",
    },
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
type Story = StoryObj<typeof Checkbox>;

/*
 * Sample copy comes from `sb.checkbox`; `args.x ||` keeps the Controls field
 * overridable.
 */
export const Default: Story = {
  render: function DefaultStory(args) {
    const t = useTranslations("sb.checkbox");

    return <Checkbox {...args} label={args.label || t("newsletter")} />;
  },
};

export const WithHint: Story = {
  render: function WithHintStory(args) {
    const t = useTranslations("sb.checkbox");

    return (
      <Checkbox
        {...args}
        defaultChecked
        label={args.label || t("comments")}
        hint={args.hint || t("commentsHint")}
      />
    );
  },
};

export const WithError: Story = {
  render: function WithErrorStory(args) {
    const t = useTranslations("sb.checkbox");

    return (
      <Checkbox
        {...args}
        label={args.label || t("terms")}
        hint={args.hint || t("hiddenHint")}
        error={args.error || t("termsError")}
      />
    );
  },
};

/** The three states side by side — the middle one reports `aria-checked="mixed"`. */
export const States: Story = {
  render: function StatesStory() {
    const t = useTranslations("sb.checkbox");

    return (
      <div className="flex flex-col gap-4">
        <Checkbox checked={false} label={t("unchecked")} />
        <Checkbox checked="indeterminate" label={t("indeterminate")} />
        <Checkbox checked label={t("checked")} />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: function SizesStory() {
    return (
      <div className="flex flex-col gap-4">
        {CHECKBOX_SIZES.map((size) => (
          <Checkbox key={size} size={size} defaultChecked label={`size="${size}"`} />
        ))}
      </div>
    );
  },
};

export const Disabled: Story = {
  render: function DisabledStory() {
    const t = useTranslations("sb.checkbox");

    return (
      <div className="flex flex-col gap-4">
        <Checkbox disabled label={t("disabled")} />
        <Checkbox disabled defaultChecked label={t("disabledChecked")} />
      </div>
    );
  },
};

/**
 * `loading` is for an optimistic toggle: the box keeps the state the server last
 * confirmed and locks until the request settles, so a second click cannot race
 * the first.
 */
export const Loading: Story = {
  render: function LoadingStory() {
    const t = useTranslations("sb.checkbox");
    const [checked, setChecked] = useState(false);
    const [pending, setPending] = useState(false);

    return (
      <div className="flex flex-col gap-4">
        <Checkbox
          checked={checked}
          loading={pending}
          label={t("published")}
          hint={pending ? t("saving") : t("publishedHint")}
          onCheckedChange={(next) => {
            setPending(true);
            // Stand-in for the mutation the real screen would fire.
            setTimeout(() => {
              setChecked(next === true);
              setPending(false);
            }, 1200);
          }}
        />
        <Checkbox loading label={t("loadingUnchecked")} />
        <Checkbox loading defaultChecked label={t("loadingChecked")} />
      </div>
    );
  },
};

/**
 * What the third state is for: the header box reflects the rows below it, and
 * clicking it from `indeterminate` selects everything.
 */
export const SelectAll: Story = {
  render: function SelectAllStory() {
    const t = useTranslations("sb.checkbox");
    const rows = [t("rowPosts"), t("rowUsers"), t("rowComments")];
    const [selected, setSelected] = useState<string[]>([rows[0]]);

    const allChecked = selected.length === rows.length;
    const headerState = allChecked ? true : selected.length > 0 ? "indeterminate" : false;

    return (
      <div className="flex flex-col gap-3">
        <Checkbox
          checked={headerState}
          onCheckedChange={() => setSelected(allChecked ? [] : rows)}
          label={t("selectAll")}
          hint={t("selectedCount", { count: selected.length })}
        />
        <div className="flex flex-col gap-3 ps-6 border-s border-border">
          {rows.map((row) => (
            <Checkbox
              key={row}
              size="sm"
              checked={selected.includes(row)}
              onCheckedChange={(checked) =>
                setSelected((current) =>
                  checked ? [...current, row] : current.filter((item) => item !== row),
                )
              }
              label={row}
            />
          ))}
        </div>
      </div>
    );
  },
};
