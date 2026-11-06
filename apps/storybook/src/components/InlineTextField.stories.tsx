import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {InlineTextField} from '@noalhub/ui/inline-text-field'
import {Typography} from '@noalhub/ui/typography'

/**
 * A title that reads as plain text and becomes an input on hover or focus, like a
 * Google Sheets document name. Commits on blur or Enter, reverts on Escape.
 */
const meta: Meta<typeof InlineTextField> = {
  title: 'UI/Forms/InlineTextField',
  component: InlineTextField,
  parameters: {layout: 'padded'},
  args: {
    value: 'Unit 3 — Travel vocabulary',
    placeholder: 'Untitled',
    label: 'Set name',
    onSubmit: () => {},
  },
  argTypes: {maxLength: {control: 'number'}},
}

export default meta
type Story = StoryObj<typeof InlineTextField>

export const Default: Story = {
  render: function Render(args) {
    const [saved, setSaved] = useState(args.value)
    return (
      <div className="flex flex-col gap-2">
        <InlineTextField {...args} value={saved} onSubmit={setSaved} />
        <Typography variant="body-4" className="text-muted-foreground">
          onSubmit: {saved || '—'}
        </Typography>
      </div>
    )
  },
}

/** Empty value shows the placeholder and is submitted as an empty string. */
export const Empty: Story = {...Default, args: {value: ''}}

/** A failed save snaps the field back to the last good value. */
export const SaveFails: Story = {
  args: {
    onSubmit: async () => {
      throw new Error('save failed')
    },
  },
}
