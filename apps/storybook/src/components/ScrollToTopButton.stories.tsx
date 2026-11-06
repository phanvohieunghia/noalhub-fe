import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {ScrollToTopButton} from '@noalhub/ui/scroll-to-top-button'
import {Typography} from '@noalhub/ui/typography'

/**
 * A floating button that returns the window to the top once it has scrolled past
 * `threshold` px. Scroll the preview down to make it appear.
 */
const meta: Meta<typeof ScrollToTopButton> = {
  title: 'UI/Navigation/ScrollToTopButton',
  component: ScrollToTopButton,
  parameters: {layout: 'fullscreen'},
  args: {label: 'Back to top', threshold: 200},
  argTypes: {threshold: {control: 'number'}},
  render: (args) => (
    <div className="p-6">
      <Typography variant="body-3" className="text-muted-foreground">
        Scroll down.
      </Typography>
      {Array.from({length: 40}, (_, i) => (
        <Typography key={i} variant="body-2" className="py-3">
          Paragraph {i + 1}
        </Typography>
      ))}
      <ScrollToTopButton {...args} />
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof ScrollToTopButton>

export const Default: Story = {}

export const LowThreshold: Story = {args: {threshold: 20}}
