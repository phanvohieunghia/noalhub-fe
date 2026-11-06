'use client'

import {routes} from '@noalhub/core/routes'
import {zodResolver} from '@hookform/resolvers/zod'
import {Link, useRouter} from '@noalhub/i18n/navigation'
import {LOCALES} from '@noalhub/i18n/config'
import {useMessage} from '@noalhub/i18n/use-message'
import {useTranslations} from 'next-intl'
import {useSearchParams} from 'next/navigation'
import {useState} from 'react'
import {useForm} from 'react-hook-form'

import {OAuthButtons} from './oauth-buttons'
import {
  AUTH_LINK_CLASS,
  AuthFooter,
  AuthForm,
  AuthPage,
} from '@noalhub/ui/auth/auth-form'
import {Input} from '@noalhub/ui/input'
import {PasswordInput} from '@noalhub/ui/password-input'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {safeRedirect} from '@noalhub/core/auth/redirect'
import type {Message} from '@noalhub/api/message'
import {loginSchema, type LoginInput} from '@noalhub/api/auth'
import {useLogin} from '@noalhub/api/auth'
import {ToastError} from '@noalhub/ui/toast'

/**
 * `AuthGuard` builds `?next=` from the raw pathname (`/en/practice`), but this
 * form navigates with the locale-aware router, which prepends the locale again
 * (`/en/en/practice`). Drop the locale segment so it is added exactly once.
 */
function stripLocalePrefix(path: string): string {
  for (const locale of LOCALES) {
    if (path === `/${locale}`) return '/'
    if (path.startsWith(`/${locale}/`)) return path.slice(locale.length + 1)
  }
  return path
}

export function LoginForm() {
  const t = useTranslations('web.auth.login')
  const tc = useTranslations('common')
  // zod's and the backend's messages are KEYS, translated here (`docs/i18n.md` §7.3).
  const m = useMessage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = stripLocalePrefix(safeRedirect(searchParams.get('next')))
  const login = useLogin()

  const [formError, setFormError] = useState<Message | string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<LoginInput>({resolver: zodResolver(loginSchema)})

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
      router.replace(next)
    } catch (error) {
      setFormError(applyApiError(error, setError, ['email', 'password']))
    }
  })

  return (
    <AuthPage title={t('title')}>
      <AuthForm
        onSubmit={onSubmit}
        loading={isSubmitting}
        submitLabel={isSubmitting ? t('submitting') : t('submit')}>
        <ToastError message={m(formError)} />

        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          error={m(errors.email?.message)}
          {...register('email')}
        />
        <PasswordInput
          label={t('password')}
          showPasswordLabel={tc('actions.showPassword')}
          hidePasswordLabel={tc('actions.hidePassword')}
          autoComplete="current-password"
          error={m(errors.password?.message)}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            href={routes.forgotPassword}
            className="text-body-3 underline underline-offset-4">
            {t('forgot')}
          </Link>
        </div>
      </AuthForm>

      <OAuthButtons next={next} />

      <AuthFooter>
        {t('noAccount')}{' '}
        <Link href={routes.register} className={AUTH_LINK_CLASS}>
          {t('register')}
        </Link>
      </AuthFooter>
    </AuthPage>
  )
}
