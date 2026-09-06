import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { useMessage } from "@noalhub/i18n/use-message";

import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { ToastError, ToastSuccess } from "@noalhub/ui/toast";
import { Typography } from "@noalhub/ui/typography";

/*
 * Each story is ONE screen of the customer auth flow, in the order a user meets
 * them. The diagram that ties them together lives in `Auth.mdx`, which links to
 * each story by id — renaming an export breaks a link there.
 *
 * The screens are rebuilt from the `@noalhub/ui` primitives instead of importing
 * `apps/web/components/auth/*`: the apps are built and deployed independently
 * and nothing may import across them (AGENTS.md), and those components call
 * `@noalhub/api` hooks that would need a live backend to render at all. What is
 * reproduced here is the LAYOUT and the copy; the real forms keep the
 * react-hook-form + zod wiring. Both read the same `web.auth` messages, so the
 * locale toolbar switches this exactly like the app.
 */

/** The card the auth layout puts every screen in. */
function AuthScreen({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-sm flex-col gap-6">{children}</div>;
}

function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-col gap-1">
      <Typography variant="h3" as="h1">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body-3" className="opacity-70">
          {subtitle}
        </Typography>
      ) : null}
    </header>
  );
}

/** The "or / Google / GitHub" block shared by login and register. */
function OAuthButtons() {
  const t = useTranslations("web.auth.oauth");

  return (
    <div className="flex flex-col gap-3">
      {/*
        `text-muted-foreground` chứ không phải `opacity-50` như trong app:
        opacity-50 trên chữ nhỏ cho tương phản 3.94:1, dưới ngưỡng WCAG AA
        (4.5:1), và `a11y: { test: "error" }` biến nó thành story đỏ trong CI.
        `apps/web/components/auth/oauth-buttons.tsx` vẫn đang dùng opacity-50 —
        đó là lỗi thật của app, không phải của story.
      */}
      <div className="text-body-4 text-muted-foreground flex items-center gap-3 uppercase tracking-wide">
        <span className="h-px flex-1 bg-current" />
        {t("divider")}
        <span className="h-px flex-1 bg-current" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline">
          <Icon icon={ICONS.google} />
          Google
        </Button>
        <Button variant="outline">
          <Icon icon={ICONS.github} />
          GitHub
        </Button>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Flows/Auth",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

/** The entry point of the flow. Three ways out: register, forgot password, and OAuth. */
export const Login: Story = {
  render: function LoginScreen() {
    const t = useTranslations("web.auth.login");

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} subtitle={t("subtitle")} />
        <form className="flex flex-col gap-4" noValidate>
          <Input label={t("email")} type="email" autoComplete="email" />
          <Input
            label={t("password")}
            type="password"
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <a href="#" className="text-body-3 underline underline-offset-4">
              {t("forgot")}
            </a>
          </div>
          <Button type="submit">{t("submit")}</Button>
        </form>
        <OAuthButtons />
        <Typography variant="body-3" className="text-center opacity-70">
          {t("noAccount")}{" "}
          <a href="#" className="underline underline-offset-4">
            {t("register")}
          </a>
        </Typography>
      </AuthScreen>
    );
  },
};

/**
 * Sign-in rejected: one form-level error and one field-level error.
 *
 * Both are KEYS translated at render time, not pre-written sentences — so
 * switching language in the toolbar switches the error copy too. That is exactly
 * what the app does: zod and the backend return keys, `useMessage()` translates
 * them (`docs/i18n.md` §7.3). Inlining Vietnamese sentences here would leave the
 * story looking correct in `vi` and wrong the moment it is switched to `en`.
 */
export const LoginRejected: Story = {
  render: function LoginRejectedScreen() {
    const t = useTranslations("web.auth.login");
    const m = useMessage();

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} subtitle={t("subtitle")} />
        <form className="flex flex-col gap-4" noValidate>
          <ToastError message={m("common.errors.generic")} />
          <Input
            label={t("email")}
            type="email"
            defaultValue="noah@noalhub.dev"
          />
          <Input
            label={t("password")}
            type="password"
            error={m("validation.password.tooShort")}
          />
          <Button type="submit">{t("submit")}</Button>
        </form>
      </AuthScreen>
    );
  },
};

/** The "no account yet" branch. On success it lands straight in the app, with no email verification. */
export const Register: Story = {
  render: function RegisterScreen() {
    const t = useTranslations("web.auth.register");

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} subtitle={t("subtitle")} />
        <form className="flex flex-col gap-4" noValidate>
          <Input label={t("displayName")} autoComplete="name" />
          <Input label={t("email")} type="email" autoComplete="email" />
          <Input
            label={t("password")}
            type="password"
            autoComplete="new-password"
          />
          <Input
            label={t("confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
          <Button type="submit">{t("submit")}</Button>
        </form>
        <OAuthButtons />
        <Typography variant="body-3" className="text-center opacity-70">
          {t("hasAccount")}{" "}
          <a href="#" className="underline underline-offset-4">
            {t("login")}
          </a>
        </Typography>
      </AuthScreen>
    );
  },
};

/** Step 1 of the forgot-password branch: enter the email. */
export const ForgotPassword: Story = {
  render: function ForgotPasswordScreen() {
    const t = useTranslations("web.auth.forgotPassword");

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} subtitle={t("subtitle")} />
        <form className="flex flex-col gap-4" noValidate>
          <Input label={t("email")} type="email" autoComplete="email" />
          <Button type="submit">{t("submit")}</Button>
        </form>
        <Typography variant="body-3" className="text-center opacity-70">
          <a href="#" className="underline underline-offset-4">
            {t("backToLogin")}
          </a>
        </Typography>
      </AuthScreen>
    );
  },
};

/**
 * Step 2: sent. The message is deliberately vague ("if the email exists") — saying
 * outright whether it does would leak the account list.
 */
export const ForgotPasswordSent: Story = {
  render: function ForgotPasswordSentScreen() {
    const t = useTranslations("web.auth.forgotPassword");

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} subtitle={t("subtitle")} />
        <ToastSuccess message={t("sent")} />
        <Typography variant="body-3" className="text-center opacity-70">
          <a href="#" className="underline underline-offset-4">
            {t("backToLogin")}
          </a>
        </Typography>
      </AuthScreen>
    );
  },
};

/** Step 3: the user clicks the link in the email, with a valid `?token=`. */
export const ResetPassword: Story = {
  render: function ResetPasswordScreen() {
    const t = useTranslations("web.auth.resetPassword");

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} subtitle={t("subtitle")} />
        <form className="flex flex-col gap-4" noValidate>
          <Input
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
          />
          <Input
            label={t("confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
          <Button type="submit">{t("submit")}</Button>
        </form>
      </AuthScreen>
    );
  },
};

/** The link is missing `?token=` or was truncated by a mail client: a dead end, with only the request-a-new-link way out. */
export const ResetPasswordInvalidLink: Story = {
  render: function ResetPasswordInvalidLinkScreen() {
    const t = useTranslations("web.auth.resetPassword");

    return (
      <AuthScreen>
        <Typography variant="h3" as="h1">
          {t("invalidLinkTitle")}
        </Typography>
        <ToastError message={t("invalidLink")} />
        <a href="#" className="text-body-3 underline underline-offset-4">
          {t("requestNewLink")}
        </a>
      </AuthScreen>
    );
  },
};

/** Password changed: shows a confirmation, then returns to sign-in after 1.5s. */
export const ResetPasswordDone: Story = {
  render: function ResetPasswordDoneScreen() {
    const t = useTranslations("web.auth.resetPassword");

    return (
      <AuthScreen>
        <ScreenHeader title={t("title")} />
        <ToastSuccess message={t("done")} />
      </AuthScreen>
    );
  },
};

/**
 * The OAuth branch returns to `/auth/callback?code=`. That code is single-use,
 * lives 60 seconds, and is exchanged for tokens immediately — tokens never travel
 * through the URL.
 */
export const OAuthFinishing: Story = {
  render: function OAuthFinishingScreen() {
    const t = useTranslations("web.auth.oauth");

    return (
      <AuthScreen>
        <Typography variant="body-3" className="opacity-70">
          {t("finishing")}
        </Typography>
      </AuthScreen>
    );
  },
};

/** A broken callback: the provider returned an error, `code` is missing, or the code has expired. */
export const OAuthFailed: Story = {
  render: function OAuthFailedScreen() {
    const t = useTranslations("web.auth.oauth");

    return (
      <AuthScreen>
        <ToastError message={t("missingCode")} />
        <a href="#" className="text-body-3 underline underline-offset-4">
          {t("backToLogin")}
        </a>
      </AuthScreen>
    );
  },
};
