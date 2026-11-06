'use client'

import {routes} from '@noalhub/core/routes'
import {zodResolver} from '@hookform/resolvers/zod'
import {Link, useRouter} from '@noalhub/i18n/navigation'
import {useMessage} from '@noalhub/i18n/use-message'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import {useForm} from 'react-hook-form'

import {AuthForm, AuthPage} from '@noalhub/ui/auth/auth-form'
import {PasswordInput} from '@noalhub/ui/password-input'
import {useResetPassword} from '@noalhub/api/auth'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {Typography} from '@noalhub/ui/typography'
import type {Message} from '@noalhub/api/message'
import {resetPasswordSchema, type ResetPasswordInput} from '@noalhub/api/auth'
import {ToastError, ToastSuccess} from '@noalhub/ui/toast'

export function ResetPasswordForm({token}: {token: string}) {
  const t = useTranslations('web.auth.resetPassword')
  const tc = useTranslations('common')
  const m = useMessage()
  const router = useRouter()
  const [formError, setFormError] = useState<Message | string | null>(null)
  const [done, setDone] = useState(false)
  const resetPassword = useResetPassword(token)

  const {
    register,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<ResetPasswordInput>({resolver: zodResolver(resetPasswordSchema)})

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await resetPassword.mutateAsync(values)
      setDone(true)
      setTimeout(() => router.replace(routes.login), 1500)
    } catch (error) {
      setFormError(applyApiError(error, setError, ['newPassword', 'token']))
    }
  })

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Typography variant="h2" as="h1">
          {t('invalidLinkTitle')}
        </Typography>
        <ToastError message={t('invalidLink')} />
        <Link
          href={routes.forgotPassword}
          className="text-body-3 underline underline-offset-4">
          {t('requestNewLink')}
        </Link>
      </div>
    )
  }

  return (
    <AuthPage title={t('title')}>
      {done ? (
        <ToastSuccess message={t('done')} />
      ) : (
        <AuthForm
          onSubmit={onSubmit}
          loading={isSubmitting}
          submitLabel={isSubmitting ? t('submitting') : t('submit')}>
          <ToastError message={m(formError)} />

          <PasswordInput
            label={t('newPassword')}
            showPasswordLabel={tc('actions.showPassword')}
            hidePasswordLabel={tc('actions.hidePassword')}
            autoComplete="new-password"
            error={m(errors.newPassword?.message)}
            {...register('newPassword')}
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
      )}
    </AuthPage>
  )
}
