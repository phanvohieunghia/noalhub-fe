'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

import {useAuthStore, useMe} from '@noalhub/api/auth'
import {Avatar} from '@noalhub/ui/avatar'
import {Button} from '@noalhub/ui/button'
import {DropdownMenu} from '@noalhub/ui/dropdown-menu'
import {Icon, ICONS} from '@noalhub/ui/icons'
import {ThemeToggle} from '@noalhub/ui/theme/theme-toggle'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

import {AdminBreadcrumb} from './admin-breadcrumb'
import {AdminLanguageSwitcher} from './language-switcher'

export function AdminHeader() {
  const t = useTranslations('nav')
  const me = useMe()
  const router = useRouter()
  const queryClient = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const [pending, setPending] = useState(false)

  const onLogout = async () => {
    setPending(true)
    await logout()
    // The cache holds ONE user's data — without clearing it, the next admin to
    // sign in on this tab sees the previous user table for a beat.
    queryClient.clear()
    router.replace('/login')
  }

  const user = me.data
  const name = user?.displayName || user?.username || ''

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
      <AdminBreadcrumb />
      <div className="flex items-center gap-3">
        <DropdownMenu
          className="w-64"
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              shape="circle"
              aria-label={t('account')}
              className="size-8 hover:bg-transparent hover:opacity-80">
              <Avatar name={name} src={user?.avatarUrl} size="sm" />
            </Button>
          }>
          <div className="flex items-center gap-3">
            <Avatar name={name} src={user?.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <Typography variant="title-4" className="truncate">
                {name || '—'}
              </Typography>
              <Typography variant="body-4" className="truncate opacity-70">
                {user?.email}
              </Typography>
            </div>
            <Tooltip
              label={pending ? t('loggingOut') : t('logout')}
              side="bottom">
              <Button
                variant="ghost"
                size="icon-sm"
                shape="circle"
                onClick={onLogout}
                loading={pending}
                aria-busy={pending}
                aria-label={t('logout')}
                className="shrink-0 text-muted-foreground hover:text-foreground">
                <Icon icon={ICONS.logout} className="size-4" />
              </Button>
            </Tooltip>
          </div>
          <Typography variant="body-4" className="mt-2 opacity-70">
            {t('role', {role: user?.role ?? '—'})}
          </Typography>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Typography variant="body-4" className="opacity-70">
              {t('appearance')}
            </Typography>
            <ThemeToggle />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Typography variant="body-4" className="opacity-70">
              {t('language')}
            </Typography>
            <AdminLanguageSwitcher />
          </div>
        </DropdownMenu>
      </div>
    </header>
  )
}
