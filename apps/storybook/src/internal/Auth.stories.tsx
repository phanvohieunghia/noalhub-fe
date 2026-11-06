import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useTranslations} from 'next-intl'

import {useMessage} from '@noalhub/i18n/use-message'

import {
  AUTH_LINK_CLASS,
  AuthFooter,
  AuthForm,
  AuthPage,
  OAUTH_PROVIDERS,
  OAuthButtons as OAuthButtonsView,
} from '@noalhub/ui/auth/auth-form'
import {AuthFrame} from '@noalhub/ui/auth/auth-frame'
import {FieldBackdrop} from '@noalhub/ui/auth/field-backdrop'
import {Input} from '@noalhub/ui/input'
import {LanguageSwitcher} from '@noalhub/ui/language-switcher'
import {LogoLockup} from '@noalhub/ui/logo-lockup'
import {QueryProvider} from '@noalhub/ui/query-provider'
import {ThemeProvider} from '@noalhub/ui/theme/theme-provider'
import {ThemeToggle} from '@noalhub/ui/theme/theme-toggle'
import {PasswordInput} from '@noalhub/ui/password-input'
import {AlertError, AlertSuccess} from '@noalhub/ui/alert'
import {Typography} from '@noalhub/ui/typography'

/*
 * Each story is ONE screen of the customer auth flow, in the order a user meets
 * them. The diagram that ties them together lives in `Auth.mdx`, which links to
 * each story by id — renaming an export breaks a link there.
 *
 * The screens are composed from `@noalhub/ui/auth/auth-form` — the same kit
 * `apps/web/components/auth/*` is built from (heading, form + submit button,
 * footer line, OAuth block), plus the same `Input` / `PasswordInput` fields. So a
 * change to any of those lands here too, instead of leaving the story showing an
 * old screen. What the real forms add on top is only the react-hook-form + zod
 * wiring and the API calls, none of which is visual. Both read the same
 * `web.auth` messages, so the locale toolbar switches this exactly like the app.
 */

/**
 * The whole auth screen as the app shows it: the coloured field, the panel, the
 * brand side and the form column. `AuthFrame` is the markup `AuthShell` renders
 * (the app adds only the GSAP entrance), so this IS the page, not a lookalike.
 *
 * Form-level messages are drawn as in-flow `Alert`s, not the toasts the app
 * raises: a toast is global and floats, so a docs page that renders every story
 * at once would stack them all on top of each other.
 */
function AuthScreen({children}: {children: React.ReactNode}) {
  const t = useTranslations('web.auth.shell')

  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthFrame
          className="min-h-[44rem] w-[min(72rem,94vw)] overflow-hidden rounded-xl"
          field={<FieldBackdrop position="absolute" />}
          logo={
            <a
              href="#"
              aria-label="Noalhub"
              onClick={(event) => event.preventDefault()}
              className="w-fit">
              <LogoLockup className="text-title-3" />
            </a>
          }
          tools={
            <>
              <ThemeToggle />
              <LanguageSwitcher compact onSwitch={() => {}} />
            </>
          }
          tagline={t('tagline')}
          features={(['chat', 'practice', 'blog'] as const).map((key) =>
            t(`features.${key}`),
          )}
          copyright={`© ${new Date().getFullYear()} Noalhub`}>
          {children}
        </AuthFrame>
      </QueryProvider>
    </ThemeProvider>
  )
}

const noop = (event: React.FormEvent) => event.preventDefault()

/** The "or / Google / GitHub" block shared by login and register. */
function OAuthButtons() {
  const t = useTranslations('web.auth.oauth')

  return (
    <OAuthButtonsView dividerLabel={t('divider')} providers={OAUTH_PROVIDERS} />
  )
}

function PasswordField({
  label,
  autoComplete,
  error,
}: {
  label: string
  autoComplete: string
  error?: string
}) {
  const tc = useTranslations('common')

  return (
    <PasswordInput
      label={label}
      showPasswordLabel={tc('actions.showPassword')}
      hidePasswordLabel={tc('actions.hidePassword')}
      autoComplete={autoComplete}
      error={error}
    />
  )
}

const meta: Meta = {
  title: 'Flows/Auth',
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj

/** The entry point of the flow. Three ways out: register, forgot password, and OAuth. */
export const Login: Story = {
  render: function LoginScreen() {
    const t = useTranslations('web.auth.login')

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AuthForm onSubmit={noop} submitLabel={t('submit')}>
            <Input label={t('email')} type="email" autoComplete="email" />
            <PasswordField
              label={t('password')}
              autoComplete="current-password"
            />
            <div className="flex justify-end">
              <a href="#" className="text-body-3 underline underline-offset-4">
                {t('forgot')}
              </a>
            </div>
          </AuthForm>
          <OAuthButtons />
          <AuthFooter>
            {t('noAccount')}{' '}
            <a href="#" className={AUTH_LINK_CLASS}>
              {t('register')}
            </a>
          </AuthFooter>
        </AuthPage>
      </AuthScreen>
    )
  },
}

/**
 * Sign-in rejected: one form-level error and one field-level error.
 *
 * Both are KEYS translated at render time, not pre-written sentences — so
 * switching language in the toolbar switches the error copy too. That is exactly
 * what the app does: zod and the backend return keys, `useMessage()` translates
 * them (`docs/i18n.md` §7.3). The app shows the form-level one as a toast; here it is an inline alert.
 */
export const LoginRejected: Story = {
  render: function LoginRejectedScreen() {
    const t = useTranslations('web.auth.login')
    const m = useMessage()

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AuthForm onSubmit={noop} submitLabel={t('submit')}>
            <AlertError message={m('common.errors.generic')} />
            <Input
              label={t('email')}
              type="email"
              defaultValue="noah@noalhub.dev"
            />
            <PasswordField
              label={t('password')}
              autoComplete="current-password"
              error={m('validation.password.tooShort')}
            />
          </AuthForm>
        </AuthPage>
      </AuthScreen>
    )
  },
}

/** The "no account yet" branch. On success it lands straight in the app, with no email verification. */
export const Register: Story = {
  render: function RegisterScreen() {
    const t = useTranslations('web.auth.register')

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AuthForm onSubmit={noop} submitLabel={t('submit')}>
            <Input label={t('displayName')} autoComplete="name" />
            <Input label={t('email')} type="email" autoComplete="email" />
            <PasswordField label={t('password')} autoComplete="new-password" />
            <PasswordField
              label={t('confirmPassword')}
              autoComplete="new-password"
            />
          </AuthForm>
          <OAuthButtons />
          <AuthFooter>
            {t('hasAccount')}{' '}
            <a href="#" className={AUTH_LINK_CLASS}>
              {t('login')}
            </a>
          </AuthFooter>
        </AuthPage>
      </AuthScreen>
    )
  },
}

/** Step 1 of the forgot-password branch: enter the email. */
export const ForgotPassword: Story = {
  render: function ForgotPasswordScreen() {
    const t = useTranslations('web.auth.forgotPassword')

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AuthForm onSubmit={noop} submitLabel={t('submit')}>
            <Input label={t('email')} type="email" autoComplete="email" />
          </AuthForm>
          <AuthFooter>
            <a href="#" className={AUTH_LINK_CLASS}>
              {t('backToLogin')}
            </a>
          </AuthFooter>
        </AuthPage>
      </AuthScreen>
    )
  },
}

/**
 * Step 2: sent. The message is deliberately vague ("if the email exists") — saying
 * outright whether it does would leak the account list.
 */
export const ForgotPasswordSent: Story = {
  render: function ForgotPasswordSentScreen() {
    const t = useTranslations('web.auth.forgotPassword')

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AlertSuccess message={t('sent')} />
          <AuthFooter>
            <a href="#" className={AUTH_LINK_CLASS}>
              {t('backToLogin')}
            </a>
          </AuthFooter>
        </AuthPage>
      </AuthScreen>
    )
  },
}

/** Step 3: the user clicks the link in the email, with a valid `?token=`. */
export const ResetPassword: Story = {
  render: function ResetPasswordScreen() {
    const t = useTranslations('web.auth.resetPassword')

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AuthForm onSubmit={noop} submitLabel={t('submit')}>
            <PasswordField
              label={t('newPassword')}
              autoComplete="new-password"
            />
            <PasswordField
              label={t('confirmPassword')}
              autoComplete="new-password"
            />
          </AuthForm>
        </AuthPage>
      </AuthScreen>
    )
  },
}

/** The link is missing `?token=` or was truncated by a mail client: a dead end, with only the request-a-new-link way out. */
export const ResetPasswordInvalidLink: Story = {
  render: function ResetPasswordInvalidLinkScreen() {
    const t = useTranslations('web.auth.resetPassword')

    return (
      <AuthScreen>
        <div className="flex flex-col gap-4">
          <Typography variant="h2" as="h1">
            {t('invalidLinkTitle')}
          </Typography>
          <AlertError message={t('invalidLink')} />
          <a href="#" className="text-body-3 underline underline-offset-4">
            {t('requestNewLink')}
          </a>
        </div>
      </AuthScreen>
    )
  },
}

/** Password changed: shows a confirmation, then returns to sign-in after 1.5s. */
export const ResetPasswordDone: Story = {
  render: function ResetPasswordDoneScreen() {
    const t = useTranslations('web.auth.resetPassword')

    return (
      <AuthScreen>
        <AuthPage title={t('title')}>
          <AlertSuccess message={t('done')} />
        </AuthPage>
      </AuthScreen>
    )
  },
}

/**
 * The OAuth branch returns to `/auth/callback?code=`. That code is single-use,
 * lives 60 seconds, and is exchanged for tokens immediately — tokens never travel
 * through the URL.
 */
export const OAuthFinishing: Story = {
  render: function OAuthFinishingScreen() {
    const t = useTranslations('web.auth.oauth')

    return (
      <AuthScreen>
        <Typography variant="body-3" className="text-muted-foreground">
          {t('finishing')}
        </Typography>
      </AuthScreen>
    )
  },
}

/** A broken callback: the provider returned an error, `code` is missing, or the code has expired. */
export const OAuthFailed: Story = {
  render: function OAuthFailedScreen() {
    const t = useTranslations('web.auth.oauth')

    return (
      <AuthScreen>
        <div className="flex flex-col gap-4">
          <AlertError message={t('missingCode')} />
          <a href="#" className="text-body-3 underline underline-offset-4">
            {t('backToLogin')}
          </a>
        </div>
      </AuthScreen>
    )
  },
}
