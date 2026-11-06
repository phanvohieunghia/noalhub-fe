/**
 * Every in-app URL of the customer web app, in one place.
 *
 * Paths are locale-less: they go through the locale-aware `Link` / `useRouter`
 * from `@noalhub/i18n/navigation`, which adds the locale segment. Renaming a URL
 * means editing it here **and** moving the folder under `apps/web/app` — Next
 * routes by folder, so the folder name cannot come from this file.
 */
export const routes = {
  home: '/',

  blog: '/blogs',
  blogPost: (slug: string) => `/blogs/${slug}`,
  blogCategory: (slug: string) => `/blogs/category/${slug}`,
  blogTags: '/blogs/tag',
  blogTag: (slug: string) => `/blogs/tag/${slug}`,
  blogRss: '/blogs/rss.xml',
  sitemap: '/sitemap.xml',

  practice: '/practice',
  practiceHistory: '/practice/history',
  practiceStats: '/practice/stats',
  practiceMistakes: '/practice/mistakes',
  practiceSet: (id: string) => `/practice/sets/${id}`,
  practiceReview: (attemptId: string) =>
    `/practice/attempts/${attemptId}/review`,

  knowledge: '/knowledge',
  knowledgeItem: (id: string) => `/knowledge/${id}`,

  chat: '/chat',
  chatConversation: (id: string) => `/chat/${id}`,
  friends: '/friends',
  profile: '/profile',
  profileOf: (username: string) => `/profile/${username}`,

  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',

  privacy: '/privacy',
  terms: '/terms',
  about: '/about',
} as const
