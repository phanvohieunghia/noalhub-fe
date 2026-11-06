import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {ImageUploadButton} from '@noalhub/ui/media/image-upload-button'
import {QueryProvider} from '@noalhub/ui/query-provider'
import {Typography} from '@noalhub/ui/typography'

/**
 * Picks an image and uploads it through `useUploadMedia` (a React Query mutation).
 * With no backend running the upload reports an error, which is itself the error
 * state worth looking at; the picking, drag-over and disabled looks work as usual.
 */
const meta: Meta<typeof ImageUploadButton> = {
  title: 'UI/Forms/ImageUploadButton',
  component: ImageUploadButton,
  parameters: {layout: 'padded'},
  args: {variant: 'button', disabled: false, onUploaded: () => {}},
  argTypes: {
    variant: {control: 'inline-radio', options: ['button', 'dropzone']},
    disabled: {control: 'boolean'},
    label: {control: 'text'},
  },
  decorators: [
    (Story) => (
      <QueryProvider>
        <div className="max-w-md">
          <Story />
        </div>
      </QueryProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ImageUploadButton>

export const Button: Story = {}

export const Dropzone: Story = {args: {variant: 'dropzone'}}

export const Disabled: Story = {args: {disabled: true}}

export const CustomLabel: Story = {args: {label: 'Choose a cover'}}

export const Uploaded: Story = {
  render: function Render(args) {
    const [name, setName] = useState<string | null>(null)
    return (
      <div className="flex flex-col gap-2">
        <ImageUploadButton
          {...args}
          onUploaded={(asset) => setName(String(asset.id))}
        />
        <Typography variant="body-4" className="text-muted-foreground">
          onUploaded: {name ?? '—'}
        </Typography>
      </div>
    )
  },
}
