import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'

import type {BlogPostListItem} from '@noalhub/api/blog'
import {listItemDescription} from '@noalhub/core/blog/seo'
import {
  PostCard as PostCardView,
  type PostCardVariant,
} from '@noalhub/ui/blog/post-card'
import {PostCover} from '@noalhub/ui/blog/post-cover'

/**
 * A post card in a listing.
 *
 * `readingMinutes` comes from the **backend** rather than being computed here:
 * list items deliberately carry neither `content` nor `contentText` so 20 posts
 * do not weigh hundreds of KB, leaving the frontend nothing to compute from
 * (`docs/blog.md` §2.3a).
 */
export function PostCard({
  post,
  featured = false,
  variant,
}: {
  post: BlogPostListItem
  featured?: boolean
  variant?: PostCardVariant
}) {
  const t = useTranslations('web.blog.post')
  const df = useDateFormat()

  return (
    <PostCardView
      Link={Link}
      featured={featured}
      variant={variant}
      href={routes.blogPost(post.slug)}
      categoryHref={routes.blogCategory(post.category.slug)}
      categoryName={post.category.name}
      title={post.title}
      description={listItemDescription(post)}
      cover={
        <PostCover
          post={post}
          sizes={
            variant === 'row'
              ? '(max-width: 640px) 100vw, 280px'
              : featured
                ? '(max-width: 768px) 100vw, 520px'
                : '(max-width: 768px) 100vw, 380px'
          }
        />
      }
      author={post.author.displayName}
      date={df.date(post.publishedAt)}
      dateTime={post.publishedAt}
      readingTime={t('readingTime', {minutes: post.readingMinutes})}
    />
  )
}
