import {getBlogCategories, getPublishedPosts} from '@noalhub/api/blog/server'

import {HomeContent} from '@/components/home/home-content'
import {HomeFooter} from '@/components/home/home-footer'
import {HomeHeader} from '@/components/layout/home-header'

export default async function Home() {
  // A backend hiccup must not take the home page down: it degrades to the empty
  // state, the same stance the public layout takes for its nav.
  const [list, categories] = await Promise.all([
    getPublishedPosts({limit: 7}).catch(() => null),
    getBlogCategories().catch(() => []),
  ])

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      {/* Page glow (Figma "Aurora blob 1–3"): three blurred circles laid out on the
          1280px design frame, which stays centred so the glow sits behind the
          hero on any width. Smaller on phones, where 900px would flood the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
        <div className="absolute left-1/2 top-0 w-320 -translate-x-1/2">
          <div className="absolute -top-32 -left-40 size-125 rounded-full bg-(--aurora-1) blur-[70px] lg:-top-50 lg:-left-65 lg:size-225" />
          <div className="absolute -top-32 left-60 size-125 rounded-full bg-(--aurora-2) blur-[70px] lg:-top-60 lg:left-155 lg:size-225" />
          <div className="absolute top-130 left-75 hidden size-175 rounded-full bg-(--aurora-3) blur-[70px] lg:block" />
        </div>
      </div>
      <div className="relative flex flex-1 flex-col">
        <HomeHeader />
        <main className="flex-1">
          <HomeContent posts={list?.items ?? []} categories={categories} />
        </main>
        <HomeFooter />
      </div>
    </div>
  )
}
