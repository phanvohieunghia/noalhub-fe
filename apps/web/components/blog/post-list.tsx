import type {BlogPostListItem} from '@noalhub/api/blog'

import {PostGrid} from '@noalhub/ui/blog/post-grid'
import {PostCard} from './post-card'

/**
 * The post listing as single-column editorial rows, plus an empty state with
 * words in it (`docs/blog.md` §6.5).
 */
export function PostList({
  posts,
  emptyMessage,
}: {
  posts: BlogPostListItem[]
  emptyMessage: string
}) {
  return (
    <PostGrid emptyMessage={emptyMessage} layout="rows">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} variant="row" />
      ))}
    </PostGrid>
  )
}
