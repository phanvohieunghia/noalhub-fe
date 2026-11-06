import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {QaChoiceList, LearnQuestionBox} from '@noalhub/ui/qa-choice-list'
import {QaOptionCard, type QaOptionState} from '@noalhub/ui/qa-option-card'
import {Typography} from '@noalhub/ui/typography'

const SHORT = [
  {id: 'a', text: 'went'},
  {id: 'b', text: 'gone'},
  {id: 'c', text: 'goes'},
  {id: 'd', text: 'going'},
]
const LONG = [
  {id: 'a', text: 'She has lived in Hanoi since she was a child.'},
  {id: 'b', text: 'She lives in Hanoi since she was a child, and never left.'},
  {id: 'c', text: 'She is living in Hanoi for ten years.'},
]

/**
 * The answer cards of a choice question, shared by the learner's screen and the
 * admin preview. Short answers (even count, ≤ 40 chars each) sit in a 2-wide
 * grid; one long answer sends the whole set back to full-width rows.
 *
 * What a tap DOES is the caller's business — `stateOf` paints each card and
 * `onPick` reports the tap.
 */
const meta: Meta<typeof QaChoiceList> = {
  title: 'UI/Data Display/QaChoiceList',
  component: QaChoiceList,
  parameters: {layout: 'padded'},
  args: {options: SHORT, multi: false, label: 'Answers', disabled: false},
  argTypes: {multi: {control: 'boolean'}, disabled: {control: 'boolean'}},
  decorators: [
    (Story) => (
      <div className="flex h-96 max-w-xl flex-col gap-3">
        <LearnQuestionBox>
          <Typography variant="body-1" weight={600}>
            Choose the correct form: “She has ___ to Paris twice.”
          </Typography>
        </LearnQuestionBox>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof QaChoiceList>

/** Single choice with live picking. */
export const SingleChoice: Story = {
  render: function Render(args) {
    const [picked, setPicked] = useState<string | null>(null)
    return (
      <QaChoiceList
        {...args}
        stateOf={(id) => (id === picked ? 'picked' : 'idle')}
        onPick={setPicked}
      />
    )
  },
}

export const MultipleChoice: Story = {
  args: {multi: true},
  render: function Render(args) {
    const [picked, setPicked] = useState<string[]>([])
    return (
      <QaChoiceList
        {...args}
        stateOf={(id) => (picked.includes(id) ? 'picked' : 'idle')}
        onPick={(id) =>
          setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
        }
      />
    )
  },
}

/** After submitting: right answer green, the learner's wrong pick red, the rest dimmed. */
export const Graded: Story = {
  args: {disabled: true},
  render: (args) => (
    <QaChoiceList
      {...args}
      stateOf={(id): QaOptionState =>
        id === 'b' ? 'right' : id === 'c' ? 'wrong' : 'dimmed'
      }
      onPick={() => {}}
    />
  ),
}

/** One long answer turns the whole set into full-width rows. */
export const LongAnswers: Story = {
  args: {options: LONG},
  render: SingleChoice.render,
}

const STATES: QaOptionState[] = [
  'idle',
  'picked',
  'right',
  'wrong',
  'chosen',
  'dimmed',
]

/** Every state of one card, round (pick one) and square (pick several). */
export const CardStates: Story = {
  decorators: [],
  render: () => (
    <div className="grid max-w-xl grid-cols-2 gap-2">
      {STATES.flatMap((state) =>
        (['round', 'square'] as const).map((shape) => (
          <QaOptionCard
            key={`${state}-${shape}`}
            text={`${state} · ${shape}`}
            role={shape === 'round' ? 'radio' : 'checkbox'}
            shape={shape}
            state={state}
            disabled={false}
            centered={false}
            onClick={() => {}}
          />
        )),
      )}
    </div>
  ),
}
