import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {
  QuestionStatsChart,
  type QuestionStatsChartLabels,
  type QuestionStatsRow,
} from '@noalhub/ui/question-stats-chart'

const LABELS: QuestionStatsChartLabels = {
  questionN: (n) => `Question ${n}`,
  never: 'Not answered yet',
  times: ({answered, correct, rate}) =>
    `${correct}/${answered} correct (${rate}%)`,
  visibleRange: ({from, to}) => `Questions ${from}–${to}`,
  zoomLabel: 'Questions in view',
  zoomAll: 'All',
  legendAnswered: 'Answered',
  legendCorrect: 'Correct',
  navStart: 'Go to first',
  navEnd: 'Go to latest',
}

/** Deterministic pseudo-random rows so the chart is stable between renders. */
const rows = (count: number): QuestionStatsRow[] =>
  Array.from({length: count}, (_, i) => {
    const answered = i % 11 === 0 ? 0 : 5 + ((i * 7) % 40)
    const correct = Math.floor(answered * (0.35 + ((i * 13) % 60) / 100))
    return {
      number: i + 1,
      question: `Which option completes sentence ${i + 1}?`,
      answered,
      correct,
    }
  })

/**
 * One bar per question: the light bar is how often it was answered, the solid part
 * how often it was answered right. Hover, tap or focus a bar for the numbers.
 * Past 25 questions the zoom presets and the start/end navigation appear.
 *
 * `scope` identifies the shape of the data: the visible window resets when it changes.
 */
const meta: Meta<typeof QuestionStatsChart> = {
  title: 'UI/Data Display/QuestionStatsChart',
  component: QuestionStatsChart,
  parameters: {layout: 'padded'},
  args: {
    rows: rows(40),
    metric: 'count',
    scope: 'set-1',
    labels: LABELS,
    onZoomChange: () => {},
  },
  argTypes: {
    metric: {control: 'inline-radio', options: ['count', 'percent']},
    zoomParam: {control: 'inline-radio', options: ['25', '50', '100', 'all']},
  },
}

export default meta
type Story = StoryObj<typeof QuestionStatsChart>

export const Count: Story = {}

export const Percent: Story = {args: {metric: 'percent'}}

/** More than 100 questions open on the last 100; zoom out with the presets. */
export const LargeSet: Story = {args: {rows: rows(300), scope: 'set-big'}}

/** Under 25 questions there is nothing to zoom, so those controls are hidden. */
export const SmallSet: Story = {args: {rows: rows(12), scope: 'set-small'}}
