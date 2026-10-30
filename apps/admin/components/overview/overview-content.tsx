'use client'

import {useAdminStats} from '@noalhub/api/admin'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {StatCard} from '@noalhub/ui/stat-card'

import {AdminErrorState} from '../admin-error-state'
import {QaAnswersSection} from './qa-answers-section'
import {SignupsSection} from './signups-section'
import {Typography} from '@noalhub/ui/typography'

/**
 * The overview — four numbers from `GET /admin/stats`.
 *
 * The backend does **not** cache this endpoint, but it is not realtime either:
 * there is a refresh button and an "updated at" stamp, rather than letting the
 * reader assume the numbers move on their own.
 */
export function OverviewContent() {
  const t = useTranslations('admin.overview')
  const df = useDateFormat()
  const stats = useAdminStats()

  // Derived counts. Clamped at 0: the four figures come from separate queries on
  // the backend, so a signup landing between them can make a part exceed the
  // total by one — a negative "unverified" would be worse than an off-by-one.
  const total = stats.data?.totalUsers ?? 0
  const verified = stats.data?.verifiedUsers ?? 0
  const recent = stats.data?.newUsersLast7Days ?? 0

  if (stats.isError) {
    return (
      <main className="w-full p-6">
        <Typography variant="h4" as="h1" className="mb-4">
          {t('title')}
        </Typography>
        <AdminErrorState error={stats.error} onRetry={() => stats.refetch()} />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h4" as="h1">
          {t('title')}
        </Typography>
        <div className="flex items-center gap-3">
          {/* dataUpdatedAt is when the response arrived, not when the backend
              computed it. Accurate enough for "how stale is this number?". */}
          {stats.dataUpdatedAt ? (
            <Typography
              variant="body-4"
              as="span"
              className="text-muted-foreground">
              {t('updatedAt', {
                date: df.dateTime(new Date(stats.dataUpdatedAt).toISOString()),
              })}
            </Typography>
          ) : null}
          <Button
            variant="outline"
            onClick={() => stats.refetch()}
            disabled={stats.isFetching}>
            <Icon
              icon={LUCIDE.refreshCw}
              className={stats.isFetching ? 'animate-spin' : ''}
            />
            {stats.isFetching ? t('refreshing') : t('refresh')}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          compact
          label={t('totalUsers')}
          icon={LUCIDE.users}
          value={total}
          isLoading={stats.isPending}
          hint={t('totalUsersHint')}
        />
        <StatCard
          compact
          label={t('verifiedUsers')}
          icon={LUCIDE.userCheck}
          value={`${verified} / ${total}`}
          progress={total > 0 ? Math.round((verified / total) * 100) : 0}
          isLoading={stats.isPending}
          hint={t('verificationSummary', {verified, total})}
        />
        <StatCard
          compact
          label={t('newUsers')}
          icon={LUCIDE.userPlus}
          value={recent}
          isLoading={stats.isPending}
          hint={t('newUsersHint')}
        />
        <StatCard
          compact
          label={t('admins')}
          icon={LUCIDE.shieldCheck}
          value={stats.data?.admins ?? 0}
          isLoading={stats.isPending}
        />
      </div>

      <SignupsSection />
      <QaAnswersSection />
    </main>
  )
}
