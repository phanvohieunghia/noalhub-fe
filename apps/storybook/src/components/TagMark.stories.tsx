import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {LUCIDE} from '@noalhub/ui/icons'
import {TagChip, TaggedFrame, type TaggedFrameTag} from '@noalhub/ui/tag-mark'
import {Typography} from '@noalhub/ui/typography'

const tag = (
  id: string,
  tone: string,
  icon: string,
  en: string,
  vi: string,
): TaggedFrameTag => ({
  id,
  key: id,
  meta: {icon, tone, label: {en, vi}},
})

const TAGS = {
  critical: tag('critical', 'danger', LUCIDE.triangleAlert, 'Critical', 'Quan trọng'),
  review: tag('review', 'warning', LUCIDE.eye, 'Review', 'Ôn lại'),
  new: tag('new', 'success', LUCIDE.sparkles, 'New', 'Mới'),
  topic: tag('topic', 'primary', LUCIDE.tag, 'Grammar', 'Ngữ pháp'),
  unknown: tag('unknown', 'made-up-tone', LUCIDE.tag, 'Unknown tone', 'Tông lạ'),
}

/**
 * A question wrapped in an outlined frame with its tags sitting on the top edge.
 * The frame takes the colour of the FIRST tag; an unknown tone falls back to
 * neutral instead of breaking. With no tags the children render untouched.
 */
const meta: Meta<typeof TaggedFrame> = {
  title: 'UI/Data Display/TaggedFrame',
  component: TaggedFrame,
  parameters: {layout: 'padded'},
  args: {locale: 'en', tags: [TAGS.critical]},
  argTypes: {locale: {control: 'inline-radio', options: ['en', 'vi', 'fr']}},
  render: (args) => (
    <div className="max-w-md">
      <TaggedFrame {...args}>
        <Typography variant="body-2">
          Which sentence uses the present perfect correctly?
        </Typography>
      </TaggedFrame>
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof TaggedFrame>

export const Critical: Story = {}

export const MultipleTags: Story = {
  args: {tags: [TAGS.critical, TAGS.review, TAGS.topic]},
}

export const UnknownTone: Story = {args: {tags: [TAGS.unknown]}}

/** A locale without a label falls back to English, then to the tag key. */
export const LocaleFallback: Story = {args: {locale: 'fr', tags: [TAGS.new]}}

export const NoTags: Story = {args: {tags: []}}

export const Chips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Object.values(TAGS).map((t) => (
        <TagChip
          key={t.id}
          icon={t.meta.icon}
          tone={t.meta.tone}
          label={t.meta.label.en}
        />
      ))}
    </div>
  ),
}
