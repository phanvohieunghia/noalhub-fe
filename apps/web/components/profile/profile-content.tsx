'use client'

import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'

import {LogoutButton} from '@/components/auth/logout-button'
import {WebLanguageSwitcher} from '@/components/layout/language-switcher'
import {ChangeUsernameForm} from '@/components/profile/change-username-form'
import {Avatar} from '@noalhub/ui/avatar'
import {Spinner} from '@noalhub/ui/spinner'
import {ThemeToggle} from '@noalhub/ui/theme/theme-toggle'
import {useAuthStore} from '@noalhub/api/auth'
import {useMe} from '@noalhub/api/auth'
import type {User} from '@noalhub/api/users'
import {Typography} from '@noalhub/ui/typography'
import {ToastError} from '@noalhub/ui/toast'

/**
 * Your own profile.
 *
 * The backend has no endpoint for reading someone else's profile yet (the spec
 * only has `/auth/me` and `PATCH /users/me/username`), so this page serves the
 * current user only.
 */
export function ProfileContent() {
  const t = useTranslations('web.profile')
  const {data, isPending, error} = useMe()
  // The store already holds a user from bootstrap/login — used as the base so the
  // page does not flash a skeleton while the query revalidates.
  const cached = useAuthStore((s) => s.user)
  const user = data ?? cached

  if (!user) {
    if (isPending) {
      return (
        <main
          role="status"
          className="flex flex-1 items-center justify-center gap-2 p-4 md:p-8 text-body-3 opacity-70">
          <Spinner />
          {t('loading')}
        </main>
      )
    }
    return (
      <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <ToastError message={error ? t('loadFailed') : t('noData')} />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 md:p-8">
      <header className="flex items-center gap-4">
        <Avatar
          name={user.displayName ?? user.username}
          src={user.avatarUrl}
          size="lg"
        />
        <div className="min-w-0">
          <Typography variant="h3" as="h1" className="truncate">
            {user.displayName ?? user.username}
          </Typography>
          <Typography
            variant="body-3"
            className="truncate font-mono opacity-70">
            @{user.username}
          </Typography>
        </div>
      </header>

      <ProfileFacts user={user} />

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <Typography variant="h5" as="h2">
          {t('username.heading')}
        </Typography>
        <ChangeUsernameForm user={user} />
      </section>

      <AccountSettings />
    </main>
  )
}

/**
 * Appearance, language and sign-out. From `md` up they live in the header's account menu;
 * on a phone that menu is a tap away from a tiny avatar, so the profile page carries the
 * same controls where people look for them.
 */
function AccountSettings() {
  const t = useTranslations('web.profile.settings')
  const tn = useTranslations('nav')

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 md:hidden dark:border-white/15">
      <Typography variant="h5" as="h2">
        {t('heading')}
      </Typography>
      <div className="flex items-center justify-between gap-2">
        <Typography variant="body-3" className="opacity-70">
          {tn('appearance')}
        </Typography>
        <ThemeToggle />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Typography variant="body-3" className="opacity-70">
          {tn('language')}
        </Typography>
        <WebLanguageSwitcher className="shrink-0" />
      </div>
      <LogoutButton className="w-full" />
    </section>
  )
}

function ProfileFacts({user}: {user: User}) {
  const t = useTranslations('web.profile.facts')
  const df = useDateFormat()

  return (
    <dl className="grid gap-3 rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15">
      <Fact label={t('email')}>
        <Typography as="span" variant="body-3" className="font-mono">
          {user.email}
        </Typography>{' '}
        {user.emailVerified ? (
          <Typography
            as="span"
            variant="body-3"
            className="text-green-700 dark:text-green-400">
            {t('verified')}
          </Typography>
        ) : (
          <Typography
            as="span"
            variant="body-3"
            className="text-amber-700 dark:text-amber-400">
            {t('unverified')}
          </Typography>
        )}
      </Fact>
      {/* `isAdmin` covers both admin roles; `role` alone would call a
          super admin a "member". */}
      <Fact label={t('role')}>{t(user.isAdmin ? 'admin' : 'member')}</Fact>
      <Fact label={t('joined')}>{df.date(user.createdAt)}</Fact>
      <Fact label={t('usernameChangedAt')}>
        {user.usernameChangedAt
          ? df.date(user.usernameChangedAt)
          : t('neverChanged')}
      </Fact>
      <Fact label={t('userId')}>
        <Typography as="span" variant="body-3" className="font-mono">
          {user.id}
        </Typography>
      </Fact>
    </dl>
  )
}

function Fact({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex justify-between gap-4">
      <Typography as="dt" variant="body-3" className="opacity-70">
        {label}
      </Typography>
      <Typography as="dd" variant="body-3" className="text-right">
        {children}
      </Typography>
    </div>
  )
}
