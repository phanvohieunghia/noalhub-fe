import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {MarkdownContent} from '@noalhub/ui/blog/markdown-content'

const SAMPLE = `## Present perfect

Use it for **experiences** and for results that still matter *now*.

- I have visited Hue twice.
- She has already finished.

| Form | Example |
| --- | --- |
| Positive | I have eaten |
| Negative | I have not eaten |

> Tip: "since" + a point in time, "for" + a length of time.

\`have + past participle\`

[A link](https://example.com)
`

/**
 * Renders a stored markdown string with the same allowlist the editor writes:
 * raw HTML is dropped, unsafe URLs are neutralised, and a trailing
 * \`<!--align:…-->\` marker aligns a paragraph or heading.
 */
const meta: Meta<typeof MarkdownContent> = {
  title: 'UI/Blog/MarkdownContent',
  component: MarkdownContent,
  parameters: {layout: 'padded'},
  args: {markdown: SAMPLE},
  argTypes: {markdown: {control: 'text'}},
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MarkdownContent>

export const Default: Story = {}

export const Aligned: Story = {
  args: {
    markdown: `## Centered heading <!--align:center-->\n\nRight-aligned paragraph. <!--align:right-->`,
  },
}

/** Raw HTML and \`javascript:\` links never reach the page. */
export const Sanitised: Story = {
  args: {
    markdown: `<script>alert(1)</script>\n\n<b>raw html</b> is dropped.\n\n[unsafe](javascript:alert(1))`,
  },
}
