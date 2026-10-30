'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useTranslations} from 'next-intl'
import {useRouter, useSearchParams} from 'next/navigation'
import {useState} from 'react'
import {useForm} from 'react-hook-form'

import {
  loginSchema,
  useAuthStore,
  useLogin,
  type LoginInput,
} from '@noalhub/api/auth'
import type {Message} from '@noalhub/api/message'
import {useMessage} from '@noalhub/i18n/use-message'
import {safeRedirect} from '@noalhub/core/auth/redirect'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {Button} from '@noalhub/ui/button'
import {AlertWarning} from '@noalhub/ui/alert'
import {ToastError} from '@noalhub/ui/toast'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {Typography} from '@noalhub/ui/typography'

/**
 * Admin REUSES web's data layer wholesale (`useLogin`, `loginSchema`) — there is
 * no copy of the contract here. The only differences are the UI and the absence
 * of any signup / OAuth path: admin has exactly one door.
 */
export function AdminLoginForm() {
  const t = useTranslations('admin.login')
  const m = useMessage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useLogin()
  const logout = useAuthStore((s) => s.logout)
  const [formError, setFormError] = useState<Message | string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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

      /*
       * Stopped at the door: an ordinary user with the right password still has
       * a valid session, but has nothing to do in here. `RoleGuard` stops them
       * too; this exists so they read the reason on the form they just
       * submitted rather than landing on a block screen.
       *
       * Gate on the CAPABILITY, not on `role === "admin"` — that comparison
       * used to lock `super_admin` out of the app that exists for them.
       */
      if (!useAuthStore.getState().user?.isAdmin) {
        await logout()
        setFormError({key: 'admin.login.notAdmin'})
        return
      }

      router.replace(safeRedirect(searchParams.get('next'), '/overview'))
    } catch (error) {
      setFormError(applyApiError(error, setError, ['email', 'password']))
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="grid size-12 place-items-center rounded-lg bg-accent text-primary-foreground">
          <Icon icon={LUCIDE.shieldCheck} className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <Typography variant="h4" as="h1">
            {t('title')}
          </Typography>
          <Typography variant="body-3" className="text-muted-foreground">
            {t('subtitle')}
          </Typography>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AlertWarning message={t('restricted')} />
        <ToastError message={m(formError)} />
        <Input
          size="lg"
          label={t('email')}
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          error={m(errors.email?.message)}
          {...register('email')}
        />
        <Input
          size="lg"
          label={t('password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={m(errors.password?.message)}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              aria-pressed={showPassword}
              className="rounded p-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40">
              <Icon
                icon={showPassword ? ICONS.eyeOff : ICONS.eye}
                className="size-5"
              />
            </button>
          }
          {...register('password')}
        />
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </div>
  )
}
