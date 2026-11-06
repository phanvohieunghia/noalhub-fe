import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {BottomSheet} from '@noalhub/ui/bottom-sheet'
import {Button} from '@noalhub/ui/button'
import {Typography} from '@noalhub/ui/typography'

/**
 * A panel that rises from the bottom edge with a grab handle — what a popover or
 * modal turns into on a narrow screen. Built on Radix Dialog (focus trap, Esc,
 * scroll lock). It has no title bar: `title` is only the accessible name.
 */
const meta: Meta<typeof BottomSheet> = {
  title: 'UI/Overlays/BottomSheet',
  component: BottomSheet,
  parameters: {layout: 'centered'},
  args: {title: 'Sort options'},
}

export default meta
type Story = StoryObj<typeof BottomSheet>

export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <BottomSheet {...args} open={open} onClose={() => setOpen(false)}>
          <Typography variant="title-3" className="mb-3">
            Sort by
          </Typography>
          <div className="flex flex-col gap-2">
            {['Newest', 'Oldest', 'Most answered'].map((label) => (
              <Button key={label} variant="outline" onClick={() => setOpen(false)}>
                {label}
              </Button>
            ))}
          </div>
        </BottomSheet>
      </>
    )
  },
}

/** Tall content scrolls inside the sheet (capped at 85% of the viewport). */
export const LongContent: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <BottomSheet {...args} open={open} onClose={() => setOpen(false)}>
          {Array.from({length: 30}, (_, i) => (
            <Typography key={i} variant="body-2" className="py-2">
              Row {i + 1}
            </Typography>
          ))}
        </BottomSheet>
      </>
    )
  },
}
