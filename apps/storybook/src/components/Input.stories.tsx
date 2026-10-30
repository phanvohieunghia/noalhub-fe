import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useTranslations} from 'next-intl'
import {Input, INPUT_SIZES} from '@noalhub/ui/input'
import {Icon, ICONS} from '@noalhub/ui/icons'

const meta: Meta<typeof Input> = {
  title: 'UI/Elements/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Nhãn hiển thị phía trên input',
    },
    error: {
      control: 'text',
      description: 'Thông báo lỗi hiển thị phía dưới input',
    },
    size: {
      control: 'inline-radio',
      options: INPUT_SIZES,
      description: 'Chiều cao ô nhập — cùng thang với Button và Select',
    },
    disabled: {
      control: 'boolean',
      description: 'Trạng thái vô hiệu hóa',
    },
    placeholder: {
      control: 'text',
      description: 'Đoạn text placeholder',
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

/*
 * Label/placeholder fall back to `sb.input` when the Controls field is empty —
 * typing still overrides them, and switching language moves the defaults too.
 */
export const Default: Story = {
  args: {},
  render: function DefaultStory(args) {
    const t = useTranslations('sb.input')

    return (
      <Input
        {...args}
        label={args.label || t('username')}
        placeholder={args.placeholder || t('namePlaceholder')}
      />
    )
  },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'example@gmail.com',
    defaultValue: 'example@',
  },
  render: function WithErrorStory(args) {
    const t = useTranslations('sb.input')
    return <Input {...args} error={args.error || t('emailError')} />
  },
}

export const Disabled: Story = {
  args: {disabled: true},
  render: function DisabledStory(args) {
    const t = useTranslations('sb.input')

    return (
      <Input
        {...args}
        label={args.label || t('coupon')}
        placeholder={args.placeholder || t('couponPlaceholder')}
      />
    )
  },
}

/** Same scale as `Button` and `Select`, so a row mixing them lines up. */
export const Sizes: Story = {
  render: function SizesStory() {
    const t = useTranslations('sb.input')

    return (
      <div className="flex max-w-sm flex-col gap-4">
        {INPUT_SIZES.map((size) => (
          <Input
            key={size}
            size={size}
            label={`${t('username')} (${size})`}
            placeholder={t('namePlaceholder')}
          />
        ))}
      </div>
    )
  },
}

/** The icon slots: leading, trailing, and the ones the field adds itself (error, lock). */
export const WithIcons: Story = {
  render: function WithIconsStory() {
    const t = useTranslations('sb.input')

    return (
      <div className="flex max-w-sm flex-col gap-4">
        <Input
          label={t('search')}
          placeholder={t('searchPlaceholder')}
          leadingIcon={ICONS.search}
        />
        <Input
          label={t('password')}
          type="password"
          defaultValue="secret"
          trailing={<Icon icon={ICONS.eye} />}
        />
        <Input
          label={t('username')}
          defaultValue="noah"
          error={t('emailError')}
          leadingIcon={ICONS.user}
          trailing={<Icon icon={ICONS.eye} />}
        />
      </div>
    )
  },
}

/** Read only keeps the value selectable and focusable; disabled does neither. */
export const ReadOnly: Story = {
  render: function ReadOnlyStory() {
    const t = useTranslations('sb.input')

    return (
      <div className="flex max-w-sm flex-col gap-4">
        <Input label={t('coupon')} defaultValue="NOALHUB-2026" readOnly />
        <Input label={t('coupon')} defaultValue="NOALHUB-2026" disabled />
      </div>
    )
  },
}
