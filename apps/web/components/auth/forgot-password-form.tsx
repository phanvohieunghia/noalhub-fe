'use client'

import {routes} from '@noalhub/core/routes'
import {zodResolver} from '@hookform/resolvers/zod'
import {Link} from '@noalhub/i18n/navigation'
import {useMessage} from '@noalhub/i18n/use-message'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import {useForm} from 'react-hook-form'

import {
  AUTH_LINK_CLASS,
  AuthFooter,
  AuthForm,
  AuthPage,
} from '@noalhub/ui/auth/auth-form'
import {Input} from '@noalhub/ui/input'
import {useForgotPassword} from '@noalhub/api/auth'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import type {Message} from '@noalhub/api/message'
import {forgotPasswordSchema, type ForgotPasswordInput} from '@noalhub/api/auth'
import {ToastError, ToastSuccess} from '@noalhub/ui/toast'

export function ForgotPasswordForm() {
  const t = useTranslations('web.auth.forgotPassword')
  const m = useMessage()
  const [formError, setFormError] = useState<Message | string | null>(null)
  const [sent, setSent] = useState(false)
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting},
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await forgotPassword.mutateAsync(values)
      setSent(true)
    } catch (error) {
      setFormError(applyApiError(error, setError, ['email']))
    }
  })

  return (
    <AuthPage title={t('title')}>
      {sent ? (
        // Never reveal whether the email exists — this prevents account enumeration.
        <ToastSuccess message={t('sent')} />
      ) : (
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
        </AuthForm>
      )}

      <AuthFooter>
        <Link href={routes.login} className={AUTH_LINK_CLASS}>
          {t('backToLogin')}
        </Link>
      </AuthFooter>
    </AuthPage>
  )
}
