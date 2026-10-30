import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useTranslations} from 'next-intl'
import {Button} from '@noalhub/ui/button'
import {Input} from '@noalhub/ui/input'
import {Select, SELECT_SIZES} from '@noalhub/ui/select'

const meta: Meta<typeof Select> = {
  title: 'UI/Elements/Select',
  component: Select,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Nhãn hiển thị phía trên',
    },
    size: {
      control: 'select',
      options: SELECT_SIZES,
      description: 'Kích thước: lg 48 · md 40 · sm 32 · xs 28',
    },
    hint: {
      control: 'text',
      description: 'Dòng gợi ý bên dưới (ẩn khi có lỗi)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder cho lựa chọn rỗng',
    },
    error: {
      control: 'text',
      description: 'Thông báo lỗi bên dưới',
    },
    disabled: {
      control: 'boolean',
      description: 'Trạng thái vô hiệu hóa',
    },
  },
}

export default meta
type Story = StoryObj<typeof Select>

/*
 * `value` is the code sent to the server, so it stays as is; only `label` goes
 * through i18n. That is the shape of a real select: options arrive from the API as
 * codes, and the client translates the text.
 */
function useSampleOptions() {
  const t = useTranslations('sb.select')

  return [
    {value: 'admin', label: t('admin')},
    {value: 'editor', label: t('editor')},
    {value: 'viewer', label: t('viewer')},
  ]
}

export const Default: Story = {
  args: {},
  render: function DefaultStory(args) {
    const t = useTranslations('sb.select')
    const options = useSampleOptions()

    return (
      <Select
        {...args}
        label={args.label || t('role')}
        placeholder={args.placeholder || t('rolePlaceholder')}
        options={options}
      />
    )
  },
}

export const WithError: Story = {
  args: {},
  render: function WithErrorStory(args) {
    const t = useTranslations('sb.select')
    const options = useSampleOptions()

    return (
      <Select
        {...args}
        label={args.label || t('role')}
        placeholder={args.placeholder || t('rolePlaceholder')}
        error={args.error || t('error')}
        options={options}
      />
    )
  },
}

export const Disabled: Story = {
  args: {defaultValue: 'admin', disabled: true},
  render: function DisabledStory(args) {
    const t = useTranslations('sb.select')
    const options = useSampleOptions()

    return (
      <Select {...args} label={args.label || t('role')} options={options} />
    )
  },
}

/** Same scale as `Button` and `Input`: lg 48 · md 40 · sm 32 · xs 28. */
export const Sizes: Story = {
  render: function SizesStory() {
    const t = useTranslations('sb.select')
    const options = useSampleOptions()

    return (
      <div className="flex max-w-sm flex-col gap-4">
        {SELECT_SIZES.map((size) => (
          <Select
            key={size}
            size={size}
            label={`${t('role')} (${size})`}
            placeholder={t('rolePlaceholder')}
            options={options}
          />
        ))}
      </div>
    )
  },
}

/** A hint sits under the field; an error replaces it. */
export const WithHint: Story = {
  render: function WithHintStory() {
    const t = useTranslations('sb.select')
    const options = useSampleOptions()

    return (
      <div className="flex max-w-sm flex-col gap-4">
        <Select
          label={t('role')}
          hint={t('hint')}
          placeholder={t('rolePlaceholder')}
          options={options}
        />
        <Select
          label={t('role')}
          hint={t('hint')}
          error={t('error')}
          placeholder={t('rolePlaceholder')}
          options={options}
        />
      </div>
    )
  },
}

/** A disabled option stays visible but cannot be picked. */
export const DisabledOption: Story = {
  render: function DisabledOptionStory() {
    const t = useTranslations('sb.select')
    const options = [
      ...useSampleOptions(),
      {value: 'owner', label: t('owner'), disabled: true},
    ]

    return (
      <Select
        label={t('role')}
        placeholder={t('rolePlaceholder')}
        options={options}
      />
    )
  },
}

/** `hideLabel` keeps the label for screen readers only, for a filter whose purpose is obvious. */
export const HiddenLabelFilter: Story = {
  render: function HiddenLabelFilterStory() {
    const t = useTranslations('sb.select')
    const options = [
      {value: '', label: t('statusAll')},
      {value: 'active', label: t('statusActive')},
      {value: 'archived', label: t('statusArchived')},
    ]

    return (
      <Select
        size="sm"
        hideLabel
        label={t('statusFilter')}
        options={options}
        className="max-w-48"
      />
    )
  },
}

/** In a filter bar next to an Input and a Button of the same size, the three line up. */
export const InFilterBar: Story = {
  render: function InFilterBarStory() {
    const t = useTranslations('sb.select')
    const options = [
      {value: '', label: t('statusAll')},
      {value: 'active', label: t('statusActive')},
      {value: 'archived', label: t('statusArchived')},
    ]

    return (
      <div className="flex max-w-2xl items-end gap-3">
        <div className="flex-1">
          <Input
            label={t('searchLabel')}
            placeholder={t('searchPlaceholder')}
          />
        </div>
        <div className="w-48">
          <Select label={t('statusFilter')} options={options} />
        </div>
        <Button>{t('apply')}</Button>
      </div>
    )
  },
}
