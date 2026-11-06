import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {
  LearnAttemptHeader,
  type LearnAttemptHeaderLabels,
} from '@noalhub/ui/learn-attempt-header'

const LABELS: LearnAttemptHeaderLabels = {
  back: 'Back',
  showHeader: 'Show header',
  hideHeader: 'Hide header',
  progress: 'Progress',
  report: 'Report a problem',
  position: ({current, total, sectionSize}) =>
    sectionSize
      ? `Question ${current} of ${total} · ${sectionSize} per section`
      : `Question ${current} of ${total}`,
}

/**
 * The learner's header while answering: a segmented progress bar with the title
 * row (back, title, report) under it. On a phone it is a drawer over the question;
 * from tablet width it simply sits above the bar. Used by the web attempt screen
 * and the admin question preview alike.
 *
 * `wide` overrides the "tablet or up" check, and `contained` anchors the drawer to
 * the nearest positioned ancestor — both for previews drawn inside a frame.
 */
const meta: Meta<typeof LearnAttemptHeader> = {
  title: 'UI/Navigation/LearnAttemptHeader',
  component: LearnAttemptHeader,
  parameters: {layout: 'fullscreen'},
  args: {
    title: 'Unit 3 — Travel vocabulary',
    answered: 12,
    total: 30,
    position: 13,
    labels: LABELS,
    onBack: () => {},
    onReport: () => {},
    wide: true,
  },
  argTypes: {
    answered: {control: {type: 'number', min: 0}},
    total: {control: {type: 'number', min: 1}},
    position: {control: {type: 'number', min: 1}},
    wide: {control: 'boolean'},
    contained: {control: 'boolean'},
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-72 bg-background">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof LearnAttemptHeader>

export const Default: Story = {}

/** Narrow layout: the header collapses into a drawer toggle. */
export const Phone: Story = {args: {wide: false, contained: true}}

export const NoReport: Story = {args: {onReport: undefined}}

/** Hundreds of questions: the bar switches to coarse sections. */
export const LargeSet: Story = {
  args: {answered: 180, total: 536, position: 181},
}

export const Finished: Story = {args: {answered: 30, total: 30, position: 30}}
