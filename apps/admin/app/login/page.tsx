import {IntlProvider} from '@noalhub/i18n/provider'
import {Suspense} from 'react'

import {AdminLoginForm} from './login-form'
import {LoginShell} from './login-shell'

export default function AdminLoginPage() {
  return (
    <IntlProvider namespace="admin.login">
      <LoginShell>
        {/* The form reads `?next` with `useSearchParams()` → a Suspense
            boundary is required, or the whole route is forced to client
            rendering at build time. */}
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </LoginShell>
    </IntlProvider>
  )
}
