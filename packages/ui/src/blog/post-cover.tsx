import Image from 'next/image'
import {
  getPostCoverUrl,
  resolvePostCoverTopic,
} from '@noalhub/core/blog/default-covers'

export interface PostCoverProps {
  post: {
    coverImageUrl?: string | null
    category?: {slug?: string; name?: string} | null
    tags?: Array<{slug?: string; name?: string}> | null
    title?: string | null
  }
  alt?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
}

/**
 * Universal Post Cover component.
 *
 * If `post.coverImageUrl` is provided, renders the real uploaded photo.
 * If null/empty, predicts the best domain topic from post metadata
 * (category, tags, title) across 50 topics and renders an ultra-lightweight,
 * sharp abstract SVG vector cover, falling back gracefully to general-default.svg.
 */
export function PostCover({
  post,
  alt = '',
  fill = true,
  priority = false,
  sizes,
  className = 'object-cover',
}: PostCoverProps) {
  const coverUrl = getPostCoverUrl(post)
  const isSvg = coverUrl.endsWith('.svg')

  return (
    <Image
      src={coverUrl}
      alt={alt || post.title || ''}
      fill={fill}
      priority={priority}
      sizes={sizes}
      unoptimized={isSvg}
      className={className}
    />
  )
}
