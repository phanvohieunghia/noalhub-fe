import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useTranslations} from 'next-intl'
import {Avatar} from '@noalhub/ui/avatar'
import {Button} from '@noalhub/ui/button'
import {Icon, ICONS} from '@noalhub/ui/icons'
import {SiteHeader} from '@noalhub/ui/site-header'
import {ThemeProvider} from '@noalhub/ui/theme/theme-provider'
import {ThemeToggle} from '@noalhub/ui/theme/theme-toggle'

type Args = {variant: 'app' | 'home'; signedIn: boolean}

/**
 * The real `SiteHeader` from `@noalhub/ui`, the same one the web app renders.
 * Only the account slot is stubbed here (the app's `HeaderAccount` reads the auth
 * store): `signedIn` swaps the avatar for search + theme switch + "Sign in".
 *
 * `app` is the bordered bar inside the product; `home` floats over the page glow
 * with centred links. Below `md` the links are hidden (the bottom navigation
 * takes over) — use the viewport toolbar.
 */
const meta: Meta<Args> = {
  title: 'UI/Navigation/Header',
  parameters: {layout: 'fullscreen'},
  args: {variant: 'app', signedIn: false},
  argTypes: {
    variant: {control: 'inline-radio', options: ['app', 'home']},
    signedIn: {control: 'boolean'},
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        {/* The home look has no fill of its own: give it the page background. */}
        <div className="bg-background text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  render: function Render({variant, signedIn}) {
    const t = useTranslations('nav')

    const account = signedIn ? (
      <button type="button" aria-label={t('account')} className="rounded-full">
        <Avatar
          name="Noah Phan"
          size="sm"
          className="bg-primary text-primary-foreground"
        />
      </button>
    ) : (
      <>
        {variant === 'home' && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('header.search')}>
            <Icon icon={ICONS.search} />
          </Button>
        )}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 whitespace-nowrap">
          {t('login')}
        </Button>
      </>
    )

    return (
      <SiteHeader
        variant={variant}
        navLabel={t('header.mainLinks')}
        links={[
          {href: '/blogs', label: t('header.blog')},
          {href: '/practice', label: t('header.practice')},
          {href: '/chat', label: t('header.chat')},
        ]}
        account={account}
      />
    )
  },
}

export default meta
type Story = StoryObj<Args>

export const Playground: Story = {}

export const AppSignedIn: Story = {args: {variant: 'app', signedIn: true}}

export const Home: Story = {args: {variant: 'home'}}

export const HomeSignedIn: Story = {args: {variant: 'home', signedIn: true}}
