import {routes} from '@noalhub/core/routes'
import {getKnowledgeDatasets} from '@noalhub/api/qa/server'
import {
  SiteFooter,
  type SiteFooterColumn,
  type SiteFooterSocial,
} from '@noalhub/ui/site-footer'
import {getTranslations} from 'next-intl/server'

import {WebLanguageSwitcher} from '@/components/layout/language-switcher'

/**
 * The home page footer: fetches the knowledge datasets and the copy, then hands
 * them to the shared `SiteFooter` in `@noalhub/ui`.
 */
export async function HomeFooter() {
  const t = await getTranslations('web.home.footer')
  const knowledge = await getKnowledgeDatasets()

  const socials: SiteFooterSocial[] = [
    {id: 'x', href: 'https://x.com', label: t('socialX')},
    {id: 'linkedin', href: 'https://linkedin.com', label: t('socialLinkedIn')},
    {id: 'instagram', href: 'https://instagram.com', label: t('socialInstagram')},
    {id: 'youtube', href: 'https://youtube.com', label: t('socialYouTube')},
  ]

  const columns: SiteFooterColumn[] = [
    {
      title: t('colRead'),
      links: [
        {href: routes.blog, label: t('blog')},
        {href: routes.blog, label: t('categories')},
      ],
    },
    {
      title: t('colLearn'),
      links: [
        {href: routes.practice, label: t('practice')},
        {href: routes.knowledge, label: t('knowledge')},
        ...knowledge.slice(0, 2).map((dataset) => ({
          href: routes.knowledgeItem(dataset.id),
          label: dataset.title,
        })),
      ],
    },
    {
      title: t('colTalk'),
      links: [
        {href: routes.chat, label: t('messages')},
        {href: routes.friends, label: t('friends')},
      ],
    },
    {
      title: t('colLegal'),
      links: [
        {href: routes.privacy, label: t('privacy')},
        {href: routes.terms, label: t('terms')},
        {href: routes.about, label: t('about')},
        {href: routes.blogRss, label: t('rss'), plain: true},
        {href: routes.sitemap, label: t('sitemap'), plain: true},
      ],
    },
  ]

  return (
    <SiteFooter
      tagline={t('tagline')}
      socials={socials}
      columns={columns}
      navLabel={t('colRead')}
      copyright={`© ${new Date().getFullYear()} Noalhub. ${t('rights')}`}
      footerEnd={<WebLanguageSwitcher className="shrink-0" />}
    />
  )
}
