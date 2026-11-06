import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {RangeSlider} from '@noalhub/ui/range-slider'
import {Typography} from '@noalhub/ui/typography'
import {ValueSlider} from '@noalhub/ui/value-slider'

/**
 * Two sliders over uneven scales. Radix only knows one linear step, so both run
 * over the INDEX of a list of reachable values: fine steps where they matter,
 * coarse ones where they do not. The current value shows in a tooltip over the
 * thumb on hover, focus and while dragging.
 */
const meta: Meta<typeof ValueSlider> = {
  title: 'UI/Forms/Sliders',
  component: ValueSlider,
  parameters: {layout: 'padded'},
}

export default meta
type Story = StoryObj<typeof ValueSlider>

const COUNTS = [
  ...Array.from({length: 20}, (_, i) => i + 1),
  30, 40, 50, 60, 80, 100, 150, 200, 300, 500,
]

export const Value: Story = {
  render: function Render() {
    const [value, setValue] = useState(20)
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <ValueSlider
          values={COUNTS}
          value={value}
          onValueChange={setValue}
          label="Questions per set"
          valueLabel={`${value} questions`}
        />
        <Typography variant="body-3" className="text-muted-foreground">
          {value} questions
        </Typography>
      </div>
    )
  },
}

export const Range: Story = {
  render: function Render() {
    const [value, setValue] = useState<[number, number]>([20, 200])
    return (
      <div className="flex max-w-md flex-col gap-3 pb-6">
        <RangeSlider
          value={value}
          onValueChange={setValue}
          segments={[
            {to: 100, step: 5},
            {to: 500, step: 50},
          ]}
          ticks={[
            {value: 0, label: '0'},
            {value: 100, label: '100'},
            {value: 300},
            {value: 500, label: '500'},
          ]}
          thumbLabels={['Minimum', 'Maximum']}
        />
        <Typography variant="body-3" className="text-muted-foreground">
          {value[0]} – {value[1]}
        </Typography>
      </div>
    )
  },
}

export const RangeDisabled: Story = {
  render: () => (
    <div className="max-w-md pb-6">
      <RangeSlider
        value={[10, 60]}
        onValueChange={() => {}}
        segments={[{to: 100, step: 5}]}
        thumbLabels={['Minimum', 'Maximum']}
        disabled
      />
    </div>
  ),
}
