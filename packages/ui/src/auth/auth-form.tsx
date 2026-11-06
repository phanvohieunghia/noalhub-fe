import {Button} from '../button'
import {Icon, ICONS} from '../icons'
import {Typography} from '../typography'

/**
 * The kit every customer auth screen (sign in, sign up, forgot / reset
 * password) is built from. The app's forms and the Storybook flow screens both
 * compose these, so a change to the heading, the footer link or the OAuth block
 * lands in both — the screens cannot drift apart.
 *
 * Nothing here knows about react-hook-form, the router or the API: labels come
 * in as props and links as children.
 */

/** Heading + subtitle, then the screen's content, in the auth column. */
export function AuthPage({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Typography variant="h2" as="h1">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body-3" className="text-muted-foreground">
            {subtitle}
          </Typography>
        ) : null}
      </header>
      {children}
    </div>
  )
}

/** The form element with its submit button; fields (and a `ToastError`) go in as children. */
export function AuthForm({
  onSubmit,
  submitLabel,
  loading = false,
  children,
}: {
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  submitLabel: string
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {children}
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  )
}

/** The centred line under a form: "No account? Register". */
export function AuthFooter({children}: {children: React.ReactNode}) {
  return (
    <Typography variant="body-3" className="text-muted-foreground text-center">
      {children}
    </Typography>
  )
}

/** The class every inline link in an auth screen wears. */
export const AUTH_LINK_CLASS = 'underline underline-offset-4'

/** "or / Google / GitHub". `onSelect` is the app's redirect; a story leaves it off. */
export function OAuthButtons({
  dividerLabel,
  providers,
  onSelect,
}: {
  dividerLabel: string
  providers: {id: string; label: string; icon: string}[]
  onSelect?: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* `text-muted-foreground` rather than `opacity-50`: opacity on small text
          gives a 3.94:1 contrast ratio, below the WCAG AA threshold of 4.5:1. */}
      <Typography
        as="div"
        variant="body-3"
        className="text-muted-foreground text-center">
        {dividerLabel}
      </Typography>

      <div className="grid grid-cols-2 gap-3">
        {providers.map(({id, label, icon}) => (
          <Button key={id} variant="outline" onClick={() => onSelect?.(id)}>
            <Icon icon={icon} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}

/** The providers the app offers, so both sides list the same two. */
export const OAUTH_PROVIDERS = [
  {id: 'google', label: 'Google', icon: ICONS.google},
  {id: 'github', label: 'GitHub', icon: ICONS.github},
]
