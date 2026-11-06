'use client'

import {useTranslations} from 'next-intl'

import {OAUTH_PROVIDERS, OAuthButtons as OAuthButtonsView} from '@noalhub/ui/auth/auth-form'
import {rememberOAuthNext} from '@noalhub/core/auth/redirect'
import {oauthStartUrl} from '@noalhub/api/auth'
import type {OAuthProvider} from '@noalhub/api/auth'

export function OAuthButtons({next}: {next?: string}) {
  const t = useTranslations('web.auth.oauth')

  // Navigating off-origin → use window.location, never <Link>.
  const go = (provider: OAuthProvider) => {
    rememberOAuthNext(next)
    window.location.assign(oauthStartUrl(provider))
  }

  return (
    <OAuthButtonsView
      dividerLabel={t('divider')}
      providers={OAUTH_PROVIDERS}
      onSelect={(id) => go(id as OAuthProvider)}
    />
  )
}
