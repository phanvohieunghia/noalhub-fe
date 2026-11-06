import {Typography} from '../typography'
import type {LinkLike} from './link-like'

export type RelatedPost = {
  id: string
  href: string
  title: string
  date: string
  dateTime: string
}

/**
 * The "Related posts" block closing a post — three from the same category. The
 * only post in a category has nothing to show, so the whole block (heading
 * included) is dropped rather than left empty.
 */
export function RelatedPosts({
  Link,
  heading,
  posts,
}: {
  Link: LinkLike
  heading: string
  posts: RelatedPost[]
}) {
  if (posts.length === 0) return null

  return (
    <section
      aria-labelledby="related-heading"
      className="border-border border-t pt-8">
      <Typography
        variant="title-4"
        as="h2"
        id="related-heading"
        className="tracking-wide uppercase opacity-60">
        {heading}
      </Typography>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="flex flex-col gap-1">
            <Link
              href={post.href}
              className="leading-snug font-medium hover:underline">
              {post.title}
            </Link>
            <Typography
              as="time"
              variant="body-4"
              dateTime={post.dateTime}
              className="opacity-60">
              {post.date}
            </Typography>
          </li>
        ))}
      </ul>
    </section>
  )
}
