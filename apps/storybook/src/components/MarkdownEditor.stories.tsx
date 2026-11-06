import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {MarkdownEditor} from '@noalhub/ui/blog/markdown-editor'
import {QaContent} from '@noalhub/ui/blog/qa-content'
import {QueryProvider} from '@noalhub/ui/query-provider'
import {Typography} from '@noalhub/ui/typography'
import type {BlogDoc} from '@noalhub/api/blog'

const SAMPLE = `Choose the **correct** form:\n\n- went\n- gone\n`

/**
 * \`TiptapEditor\`'s twin for content stored as a markdown STRING: same toolbar,
 * same allowlisted schema. Markdown is parsed on load and serialised on every
 * keystroke, so anything outside the schema (h1/h5, raw HTML) does not survive an
 * edit. \`value\` is read once on mount — remount with a new \`key\` to load another
 * document. Image upload needs a backend, so that button errors here.
 */
const meta: Meta<typeof MarkdownEditor> = {
  title: 'UI/Blog/MarkdownEditor',
  component: MarkdownEditor,
  parameters: {layout: 'padded'},
  args: {value: SAMPLE, onChange: () => {}},
  decorators: [
    (Story) => (
      <QueryProvider>
        <Story />
      </QueryProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MarkdownEditor>

export const Default: Story = {
  render: function Render(args) {
    const [markdown, setMarkdown] = useState(args.value)
    return (
      <div className="flex max-w-2xl flex-col gap-3">
        <MarkdownEditor {...args} onChange={setMarkdown} />
        <Typography variant="body-4" className="font-mono whitespace-pre-wrap text-muted-foreground">
          {markdown}
        </Typography>
      </div>
    )
  },
}

export const Empty: Story = {args: {value: ''}}

/** How a question body renders for the learner: the blog prose with tighter spacing. */
export const QuestionContent: StoryObj<typeof QaContent> = {
  render: () => {
    const doc: BlogDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{type: 'text', text: 'Which sentence is correct?'}],
        },
      ],
    }
    return (
      <div className="max-w-md">
        <QaContent doc={doc} />
      </div>
    )
  },
}
