import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {LUCIDE} from '@noalhub/ui/icons'
import {MetricsCard, type MetricItem} from '@noalhub/ui/metrics-card'

const ITEMS: MetricItem[] = [
  {key: 'answered', icon: LUCIDE.circleCheck, value: '128', label: 'Answered', detail: '128 of 150'},
  {key: 'accuracy', icon: LUCIDE.target, iconClass: 'text-success', value: '86%', label: 'Accuracy'},
  {key: 'streak', icon: LUCIDE.flame, iconClass: 'text-warning', value: '7d', label: 'Streak', detail: '7 days'},
  {key: 'time', icon: LUCIDE.clock, value: '42m', label: 'Time spent'},
]

/**
 * A compact row of icon + figure chips. Hover or focus it to open a card with one
 * label/value row per metric. `detail` overrides the inline figure inside the card.
 */
const meta: Meta<typeof MetricsCard> = {
  title: 'UI/Data Display/MetricsCard',
  component: MetricsCard,
  parameters: {layout: 'centered'},
  args: {title: 'Your progress', items: ITEMS, layout: 'grid'},
  argTypes: {layout: {control: 'inline-radio', options: ['grid', 'row']}},
}

export default meta
type Story = StoryObj<typeof MetricsCard>

export const Grid: Story = {}

export const Row: Story = {args: {layout: 'row'}}

export const TwoMetrics: Story = {args: {items: ITEMS.slice(0, 2)}}
