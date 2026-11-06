import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useTranslations} from 'next-intl'
import {SiteFooter} from '@noalhub/ui/site-footer'
import {LanguageSwitcher} from '@noalhub/ui/language-switcher'
import {QueryProvider} from '@noalhub/ui/query-provider'

type Args = {withKnowledge: boolean}

/**
 * The real `SiteFooter` from `@noalhub/ui`, the same one the web app renders:
 * brand, tagline and socials on the left, four link columns on the right,
 * copyright, and the mountain scenery that swaps with light/dark. Toggle the
 * theme from the toolbar to see both.
 *
 * The web app fills the Learn column with published knowledge datasets (fetched
 * on the server); here `withKnowledge` stands in for them.
 */
const meta: Meta<Args> = {
  title: 'UI/Navigation/Footer',
  parameters: {layout: 'fullscreen'},
  args: {withKnowledge: true},
  argTypes: {withKnowledge: {control: 'boolean'}},
  decorators: [
    (Story) => (
      <QueryProvider>
        <Story />
      </QueryProvider>
    ),
  ],
  render: function Render({withKnowledge}) {
    const t = useTranslations('web.home.footer')

    return (
      <SiteFooter
        tagline={t('tagline')}
        navLabel={t('colRead')}
        copyright={`© ${new Date().getFullYear()} Noalhub. ${t('rights')}`}
        footerEnd={<LanguageSwitcher onSwitch={() => {}} className="shrink-0" />}
        socials={[
          {id: 'x', href: 'https://x.com', label: t('socialX')},
          {id: 'linkedin', href: 'https://linkedin.com', label: t('socialLinkedIn')},
          {id: 'instagram', href: 'https://instagram.com', label: t('socialInstagram')},
          {id: 'youtube', href: 'https://youtube.com', label: t('socialYouTube')},
        ]}
        columns={[
          {
            title: t('colRead'),
            links: [
              {href: '/blogs', label: t('blog')},
              {href: '/blogs', label: t('categories')},
            ],
          },
          {
            title: t('colLearn'),
            links: [
              {href: '/practice', label: t('practice')},
              {href: '/knowledge', label: t('knowledge')},
              ...(withKnowledge
                ? [
                    {href: '/knowledge/1', label: 'Tiếng Anh giao tiếp'},
                    {href: '/knowledge/2', label: 'Toán lớp 12'},
                  ]
                : []),
            ],
          },
          {
            title: t('colTalk'),
            links: [
              {href: '/chat', label: t('messages')},
              {href: '/friends', label: t('friends')},
            ],
          },
          {
            title: t('colLegal'),
            links: [
              {href: '/privacy', label: t('privacy')},
              {href: '/terms', label: t('terms')},
              {href: '/about', label: t('about')},
              {href: '/blogs/rss.xml', label: t('rss'), plain: true},
              {href: '/sitemap.xml', label: t('sitemap'), plain: true},
            ],
          },
        ]}
      />
    )
  },
}

export default meta
type Story = StoryObj<Args>

export const Playground: Story = {}

/** No knowledge datasets published yet: the Learn column shrinks. */
export const WithoutKnowledge: Story = {args: {withKnowledge: false}}
