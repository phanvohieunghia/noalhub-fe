import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import React from 'react'

/**
 * The abstract SVG covers a blog post falls back to when it has no uploaded
 * photo (`packages/core/src/blog/default-covers.ts`).
 *
 * The list is read from `apps/web/public/images/default-covers` at build time,
 * so a new SVG dropped into that folder appears here without editing this file.
 */
const meta: Meta = {
  title: 'Foundations/Default covers',
  parameters: {layout: 'fullscreen', controls: {disable: true}},
}

export default meta
type Story = StoryObj

const files = (
  import.meta as unknown as {
    glob: (p: string, o: object) => Record<string, string | {src?: string}>
  }
).glob(
  '../../../web/public/images/default-covers/*.svg',
  {query: '?url', import: 'default', eager: true},
)

const covers = Object.entries(files)
  .filter(([path]) => !path.includes('vectorart32'))
  .map(([path, url]) => {
    const filename = path.split('/').pop()!
    const resolvedUrl =
      typeof url === 'string'
        ? url
        : (url as {src?: string})?.src || `/images/default-covers/${filename}`
    return {
      name: filename.replace(/\.svg$/, ''),
      url: resolvedUrl,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export const Gallery: Story = {
  render: () => (
    <div className="p-6">
      <p className="text-muted-foreground mb-4 text-sm">{covers.length} covers</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {covers.map(({name, url}) => (
          <figure key={name} className="space-y-2">
            <img
              src={url}
              alt={name}
              className="border-border aspect-[16/9] w-full rounded-lg border object-cover"
            />
            <figcaption className="text-muted-foreground text-xs">
              {name}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  ),
}
