import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {CategoryFilter} from '@noalhub/ui/blog/category-filter'
import type {LinkLike} from '@noalhub/ui/blog/link-like'

/** A plain `<a>`: a real navigation would send the preview iframe away. */
const StoryLink: LinkLike = ({href: _href, children, ...props}) => (
  <a href="#" {...props}>
    {children}
  </a>
)

/**
 * The row of category pills above a listing: "All" plus each category, current
 * one filled. A list of real links (each category is an indexed page), so the
 * current one is `aria-current="page"`, not a selected tab. Renders nothing when
 * there is only one item.
 */
const meta: Meta<typeof CategoryFilter> = {
  title: 'UI/Blog/CategoryFilter',
  component: CategoryFilter,
  parameters: {layout: 'padded'},
  args: {
    Link: StoryLink,
    label: 'Categories',
    items: [
      {href: '/blogs', label: 'All', current: true},
      {href: '/blogs/category/grammar', label: 'Grammar'},
      {href: '/blogs/category/vocabulary', label: 'Vocabulary'},
      {href: '/blogs/category/listening', label: 'Listening'},
    ],
  },
}

export default meta
type Story = StoryObj<typeof CategoryFilter>

export const Default: Story = {}

export const CategorySelected: Story = {
  args: {
    items: [
      {href: '/blogs', label: 'All'},
      {href: '/blogs/category/grammar', label: 'Grammar', current: true},
      {href: '/blogs/category/vocabulary', label: 'Vocabulary'},
    ],
  },
}

/** One item is not a filter: nothing renders. */
export const SingleItemHidden: Story = {
  args: {items: [{href: '/blogs', label: 'All', current: true}]},
}
