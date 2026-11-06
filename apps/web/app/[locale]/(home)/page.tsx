import {getBlogCategories, getPublishedPosts} from '@noalhub/api/blog/server'
import {getTranslations} from 'next-intl/server'

import {Panel} from '@noalhub/ui/panel'

import {HomeContent} from '@/components/home/home-content'
import {HomeField} from '@/components/home/home-field'
import {HomeFooter} from '@/components/home/home-footer'
import {HomeHero} from '@/components/home/home-hero'
import {HomeHeader} from '@/components/layout/home-header'

/**
 * The home page: panels on a coloured field (`docs/ui-reference-gas-for-africa.md`).
 * The first panel holds the header and the hero and fills exactly one screen (a
 * sketch is wiped in behind the heading, `docs/gsap_sketch_reveal_guide.md`); the
 * second holds the posts. The field around them carries a slowly moving drawing
 * (`HomeField`).
 */
export default async function Home() {
  // A backend hiccup must not take the home page down: it degrades to the empty
  // state, the same stance the public layout takes for its nav.
  const [list, categories] = await Promise.all([
    getPublishedPosts({limit: 10}).catch(() => null),
    getBlogCategories().catch(() => []),
  ])

  const t = await getTranslations('web.home.hero')

  return (
    <div className="relative isolate flex flex-1 flex-col bg-field">
      <HomeField />
      <main className="flex flex-1 flex-col gap-3 p-3 md:gap-8 md:p-8">
        {/* The hero is one whole screen: the viewport minus the field around it. */}
        <Panel
          padding="none"
          className="flex min-h-[calc(100svh-1.5rem)] flex-col md:min-h-[calc(100svh-4rem)]">
          <HomeHeader />
          <HomeHero
            copy={{
              line1: t('line1'),
              line2: t('line2'),
              lead: t('lead'),
              cta: t('cta'),
              cards: {
                reality: {
                  title: t('cards.reality.title'),
                  points: [
                    t('cards.reality.point1'),
                    t('cards.reality.point2'),
                  ],
                },
                solution: {
                  title: t('cards.solution.title'),
                  points: [
                    t('cards.solution.point1'),
                    t('cards.solution.point2'),
                    t('cards.solution.point3'),
                  ],
                },
                statement: {
                  text: t('cards.statement.text'),
                },
              },
            }}
          />
        </Panel>
        <HomeContent posts={list?.items ?? []} categories={categories} />
      </main>
      <HomeFooter />
    </div>
  )
}
