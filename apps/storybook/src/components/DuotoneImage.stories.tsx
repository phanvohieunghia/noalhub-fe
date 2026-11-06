import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {DuotoneImage} from '@noalhub/ui/duotone-image'
import {Panel} from '@noalhub/ui/panel'

/**
 * A drawn scene instead of a remote photo, so the story works offline. It has
 * a full range of greys on purpose — a flat image would hide what the duotone
 * does to shadows and highlights.
 */
const SCENE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e8e8e8"/><stop offset="1" stop-color="#6a6a6a"/>
  </linearGradient></defs>
  <rect width="640" height="400" fill="url(#s)"/>
  <circle cx="500" cy="90" r="46" fill="#fafafa"/>
  <g fill="#2a2a2a"><rect x="40" y="170" width="70" height="230"/><rect x="130" y="120" width="60" height="280"/>
  <rect x="210" y="200" width="90" height="200"/><rect x="320" y="140" width="50" height="260"/>
  <rect x="390" y="190" width="80" height="210"/><rect x="490" y="150" width="110" height="250"/></g>
  <g fill="#9a9a9a"><rect x="150" y="150" width="20" height="30"/><rect x="335" y="170" width="20" height="30"/>
  <rect x="515" y="180" width="30" height="40"/></g>
  <rect y="360" width="640" height="40" fill="#111"/>
</svg>`)}`

const meta: Meta<typeof DuotoneImage> = {
  title: 'UI/Media/DuotoneImage',
  component: DuotoneImage,
  parameters: {layout: 'padded'},
  args: {src: SCENE, alt: 'A city skyline at dusk'},
}

export default meta
type Story = StoryObj<typeof DuotoneImage>

export const Playground: Story = {
  render: (args) => (
    <DuotoneImage
      {...args}
      className="aspect-[16/10] w-full max-w-xl rounded-2xl"
    />
  ),
}

/** Before and after on the same file. */
export const Compare: Story = {
  render: (args) => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={args.src}
        alt=""
        className="aspect-[16/10] w-full rounded-2xl object-cover"
      />
      <DuotoneImage {...args} className="aspect-[16/10] w-full rounded-2xl" />
    </div>
  ),
}

/** The article hero: only the two bottom corners are rounded, deeply. */
export const ArticleHero: Story = {
  render: (args) => (
    <div className="bg-primary p-4 md:p-10">
      <Panel padding="lg">
        <DuotoneImage
          {...args}
          className="aspect-[16/8] w-full rounded-b-[4rem] rounded-t-xl"
        />
      </Panel>
    </div>
  ),
}
