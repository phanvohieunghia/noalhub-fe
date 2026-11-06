import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'

import type {BlogPostListItem} from '@noalhub/api/blog'
import {RelatedPosts as RelatedPostsView} from '@noalhub/ui/blog/related-posts'

/**
 * The "Related posts" block at the end of each post — 3 posts from the **same
 * category**.
 *
 * Filtered by category rather than tag: each post has exactly one category,
 * making this a deterministic query, while `tags` is an **unordered set** — the
 * "first tag" is merely whichever the author typed first (`docs/blog.md` §2.5,
 * §2.6).
 */
export function RelatedPosts({posts}: {posts: BlogPostListItem[]}) {
  const t = useTranslations('web.blog.post')
  const df = useDateFormat()

  return (
    <RelatedPostsView
      Link={Link}
      heading={t('relatedHeading')}
      posts={posts.map((post) => ({
        id: post.id,
        href: routes.blogPost(post.slug),
        title: post.title,
        date: df.date(post.publishedAt),
        dateTime: post.publishedAt,
      }))}
    />
  )
}
