/**
 * The shape of a link component the blog views accept. The app passes its
 * locale-aware `Link`; a story passes a plain `<a>`. This keeps the views free
 * of any router.
 */
export type LinkLike = React.ComponentType<{
  href: string
  className?: string
  tabIndex?: number
  'aria-hidden'?: boolean
  'aria-current'?: 'page'
  children?: React.ReactNode
}>
