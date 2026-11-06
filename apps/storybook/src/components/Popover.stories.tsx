import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {Button} from '@noalhub/ui/button'
import {HoverFlyout} from '@noalhub/ui/hover-flyout'
import {Popover, PopoverContent, PopoverTrigger} from '@noalhub/ui/popover'
import {Typography} from '@noalhub/ui/typography'

/**
 * Two floating panels. `Popover` opens on click and closes on Esc or an outside
 * click; `HoverFlyout` opens on hover or keyboard focus and stays open while the
 * pointer crosses the gap to the panel.
 */
const meta: Meta<typeof Popover> = {
  title: 'UI/Overlays/Popover',
  component: Popover,
  parameters: {layout: 'centered'},
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Filters</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <Typography variant="title-4">Filters</Typography>
        <Typography variant="body-3" className="mt-1 text-muted-foreground">
          Narrow the list by stage or status.
        </Typography>
      </PopoverContent>
    </Popover>
  ),
}

export const AlignStart: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Align start</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48">
        <Typography variant="body-3">Hangs from the left edge.</Typography>
      </PopoverContent>
    </Popover>
  ),
}

export const Flyout: Story = {
  render: () => (
    <HoverFlyout
      label="Practice"
      side="right"
      trigger={<Button variant="outline">Hover me</Button>}>
      <ul className="flex flex-col">
        {['Mistakes', 'History', 'Sets'].map((item) => (
          <li key={item} className="rounded-md px-3 py-1.5 text-body-3 hover:bg-muted">
            {item}
          </li>
        ))}
      </ul>
    </HoverFlyout>
  ),
}

/** `canOpen` returning false keeps the card shut. */
export const FlyoutDisabled: Story = {
  render: () => (
    <HoverFlyout
      canOpen={() => false}
      trigger={<Button variant="outline">Never opens</Button>}>
      <Typography variant="body-3">Hidden</Typography>
    </HoverFlyout>
  ),
}
