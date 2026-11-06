import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {
  DifficultyBadge,
  DifficultyBars,
  DifficultyPicker,
  type DifficultyLevel,
} from '@noalhub/ui/difficulty'

const LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/**
 * Three difficulty pieces: the rising bars, a read-only chip, and a segmented
 * picker (same pill shape as the theme and language switches). Labels come in as
 * props — the package pins no i18n namespace.
 */
const meta: Meta<typeof DifficultyPicker> = {
  title: 'UI/Elements/Difficulty',
  component: DifficultyPicker,
  parameters: {layout: 'padded'},
  args: {label: 'Difficulty', labels: LABELS, value: 'medium'},
  argTypes: {
    value: {control: 'inline-radio', options: ['', 'easy', 'medium', 'hard']},
    size: {control: 'inline-radio', options: ['md', 'sm']},
    clearable: {control: 'boolean', description: 'Bấm lại để bỏ chọn'},
    hideLabel: {control: 'boolean'},
  },
}

export default meta
type Story = StoryObj<typeof DifficultyPicker>

export const Picker: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value)
    return <DifficultyPicker {...args} value={value} onChange={setValue} />
  },
}

export const PickerSmall: Story = {
  ...Picker,
  args: {size: 'sm', hideLabel: true},
}

export const NotClearable: Story = {...Picker, args: {clearable: false}}

export const Badges: Story = {
  render: () => (
    <div className="flex gap-2">
      {(Object.keys(LABELS) as DifficultyLevel[]).map((level) => (
        <DifficultyBadge key={level} level={level} label={LABELS[level]} />
      ))}
    </div>
  ),
}

export const Bars: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(Object.keys(LABELS) as DifficultyLevel[]).map((level) => (
        <DifficultyBars key={level} level={level} />
      ))}
    </div>
  ),
}
