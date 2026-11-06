import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {Badge} from '@noalhub/ui/badge'
import {
  Panel,
  PANEL_ELEMENTS,
  PANEL_PADDINGS,
  PANEL_RADII,
  PANEL_TONES,
} from '@noalhub/ui/panel'

const meta: Meta<typeof Panel> = {
  title: 'UI/Surfaces/Panel',
  component: Panel,
  parameters: {layout: 'fullscreen'},
  argTypes: {
    tone: {control: 'select', options: PANEL_TONES},
    radius: {control: 'select', options: PANEL_RADII},
    padding: {control: 'select', options: PANEL_PADDINGS},
    as: {control: 'select', options: PANEL_ELEMENTS},
  },
  // The panel is meant to sit on a coloured field, so every story gets one.
  decorators: [
    (Story) => (
      <div className="bg-primary p-4 md:p-10">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Panel>

export const Playground: Story = {
  args: {tone: 'surface', radius: 'xl', padding: 'lg'},
  render: (args) => (
    <Panel {...args}>
      <Badge tone="brand">Energy</Badge>
      <h2 className="mt-3 max-w-xl text-h2 font-semibold">
        A quiet place to read, learn and talk
      </h2>
      <p className="mt-3 max-w-prose text-body-2">
        The panel holds one whole block of a public page and stands out from the
        field behind it by tone alone.
      </p>
    </Panel>
  ),
}

export const Tones: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {PANEL_TONES.map((tone) => (
        <Panel key={tone} tone={tone} padding="md">
          <p className="text-title-3 font-medium">{tone}</p>
          <p className="mt-1 text-body-3">Ground and ink travel together.</p>
        </Panel>
      ))}
    </div>
  ),
}
