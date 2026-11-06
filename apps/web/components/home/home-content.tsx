import {getDateFormat} from '@noalhub/i18n/date-format-server'
import {getTranslations} from 'next-intl/server'

import type {BlogCategory, BlogPostListItem} from '@noalhub/api/blog'
import type {DifficultyLevel} from '@noalhub/ui/difficulty'
import {Typography} from '@noalhub/ui/typography'

import {HomePractice, type HomePracticeItem} from './home-practice'
import {HomeStories} from './home-stories'

/**
 * The home page body under the hero: the post list (`HomeStories`, after
 * `docs/reference/gas-for-africa/04-blog-cards-scroll.jpg`), then the practice
 * teaser (`HomePractice`).
 *
 * Posts and categories are real data; the practice questions are editorial copy
 * and live in `web.home.practice`. Dates and reading time are formatted here, on the
 * server, because the list is a client component and the client bundle of `/` does
 * not carry `web.home`.
 */
export async function HomeContent({
  posts,
  categories,
}: {
  posts: BlogPostListItem[]
  categories: BlogCategory[]
}) {
  const t = await getTranslations('web.home')
  const df = await getDateFormat()

  const stories = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    category: post.category,
    author: post.author,
    dateLabel: df.date(post.publishedAt),
    dateTime: post.publishedAt,
    minutesLabel: t('readingTime', {minutes: post.readingMinutes}),
  }))

  const practiceItems: HomePracticeItem[] = (['q1', 'q2', 'q3'] as const).map(
    (q) => ({
      topic: t(`practice.items.${q}.topic`),
      difficulty: t(`practice.items.${q}.difficulty`) as DifficultyLevel,
      question: t(`practice.items.${q}.question`),
      options: (['o1', 'o2', 'o3', 'o4'] as const).map((o) =>
        t(`practice.items.${q}.options.${o}`),
      ),
      answer: Number(t(`practice.items.${q}.answer`)),
    }),
  )

  return (
    <>
      {stories.length > 0 ? (
        <HomeStories
          posts={stories}
          categories={categories}
          copy={{
            heading: t('latest.heading'),
            filtersLabel: t('latest.filters'),
            all: t('latest.all'),
            viewAll: t('latest.viewAll'),
            read: t('latest.read'),
            by: t.raw('latest.by') as string,
          }}
        />
      ) : (
        <Typography variant="body-3" className="text-brand-50">
          {t('empty')}
        </Typography>
      )}

      <HomePractice
        items={practiceItems}
        copy={{
          eyebrow: t('practice.eyebrow'),
          heading: t('practice.heading'),
          lead: t('practice.lead'),
          steps: (['read', 'ask', 'keep'] as const).map((key) => ({
            title: t(`practice.steps.${key}.title`),
            body: t(`practice.steps.${key}.body`),
          })),
          cta: t('practice.cta'),
          demoLabel: t('practice.demoLabel'),
          progress: t.raw('practice.progress') as string,
          difficulty: {
            easy: t('practice.difficulty.easy'),
            medium: t('practice.difficulty.medium'),
            hard: t('practice.difficulty.hard'),
          },
        }}
      />
    </>
  )
}
