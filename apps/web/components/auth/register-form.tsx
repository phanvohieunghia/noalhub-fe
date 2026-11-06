'use client'

import {routes} from '@noalhub/core/routes'
import {zodResolver} from '@hookform/resolvers/zod'
import {Link, useRouter} from '@noalhub/i18n/navigation'
import {useMessage} from '@noalhub/i18n/use-message'
import {useTranslations} from 'next-intl'
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
import {DEFAULT_REDIRECT} from '@noalhub/core/auth/redirect'
import type {Message} from '@noalhub/api/message'
import {registerSchema, type RegisterInput} from '@noalhub/api/auth'
import {useRegister} from '@noalhub/api/auth'
import {ToastError} from '@noalhub/ui/toast'

export function RegisterForm() {
  const t = useTranslations('web.auth.register')
  const tc = useTranslations('common')
  const m = useMessage()
  const router = useRouter()
  const registerUser = useRegister()

  const [formError, setFormError] = useState<Message | string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<RegisterInput>({resolver: zodResolver(registerSchema)})

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerUser.mutateAsync(values)
      router.replace(DEFAULT_REDIRECT)
    } catch (error) {
      setFormError(
        applyApiError(error, setError, ['email', 'password', 'displayName']),
      )
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
          label={t('displayName')}
          autoComplete="name"
          error={m(errors.displayName?.message)}
          {...register('displayName')}
        />
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
          autoComplete="new-password"
          error={m(errors.password?.message)}
          {...register('password')}
        />
        <PasswordInput
          label={t('confirmPassword')}
          showPasswordLabel={tc('actions.showPassword')}
          hidePasswordLabel={tc('actions.hidePassword')}
          autoComplete="new-password"
          error={m(errors.confirmPassword?.message)}
          {...register('confirmPassword')}
        />
      </AuthForm>

      <OAuthButtons />

      <AuthFooter>
        {t('hasAccount')}{' '}
        <Link href={routes.login} className={AUTH_LINK_CLASS}>
          {t('login')}
        </Link>
      </AuthFooter>
    </AuthPage>
  )
}
