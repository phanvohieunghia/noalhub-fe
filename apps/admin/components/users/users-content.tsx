'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

import {useAdminUsers, type AdminUser} from '@noalhub/api/admin'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'
import {Avatar} from '@noalhub/ui/avatar'
import {Badge} from '@noalhub/ui/badge'
import {Checkbox} from '@noalhub/ui/checkbox'
import {DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {Pagination} from '@noalhub/ui/pagination'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {
  TableActionsHeaderCell,
  TableBody,
  TableBulkAction,
  TableBulkBar,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
  TableSortHeaderCell,
} from '@noalhub/ui/table'

import {AdminErrorState} from '../admin-error-state'
import {useUserFilters} from './use-user-filters'
import {Typography} from '@noalhub/ui/typography'

const COLUMN_COUNT = 6

export function UsersContent() {
  const t = useTranslations('admin.users')
  const {query, searchInput, setSearchInput, setRole, setPage, toggleSort} =
    useUserFilters()
  const users = useAdminUsers(query)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const rows = users.data?.items ?? []
  const selectedCount = rows.filter((user) => selected.has(user.id)).length
  const allSelected = rows.length > 0 && selectedCount === rows.length
  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <main className="w-full p-6">
      <Typography variant="h4" as="h1">
        {t('title')}
      </Typography>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label={t('search')}
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          label={t('role')}
          placeholder={t('allRoles')}
          value={query.role ?? ''}
          onChange={(event) => setRole(event.target.value)}
          options={[
            {value: 'user', label: 'User'},
            {value: 'admin', label: 'Admin'},
          ]}
        />
      </div>

      {users.isError ? (
        <div className="mt-4">
          <AdminErrorState
            error={users.error}
            onRetry={() => users.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t('tableCaption')}>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-12">
                  <Checkbox
                    size="sm"
                    aria-label={t('selectAll')}
                    checked={
                      allSelected
                        ? true
                        : selectedCount > 0
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={(on) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        for (const user of rows) {
                          if (on === true) next.add(user.id)
                          else next.delete(user.id)
                        }
                        return next
                      })
                    }
                  />
                </TableHeaderCell>
                <TableSortHeaderCell
                  direction={
                    query.sort === 'username' ? (query.order ?? 'asc') : false
                  }
                  onToggle={() => toggleSort('username')}
                  sortHint={t('sortHint', {column: t('columns.user')})}>
                  {t('columns.user')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={
                    query.sort === 'role' ? (query.order ?? 'asc') : false
                  }
                  onToggle={() => toggleSort('role')}
                  sortHint={t('sortHint', {column: t('columns.role')})}>
                  {t('columns.role')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={
                    query.sort === 'createdAt' ? (query.order ?? 'asc') : false
                  }
                  onToggle={() => toggleSort('createdAt')}
                  sortHint={t('sortHint', {column: t('columns.joined')})}>
                  {t('columns.joined')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={
                    query.sort === 'email' ? (query.order ?? 'asc') : false
                  }
                  onToggle={() => toggleSort('email')}
                  sortHint={t('sortHint', {column: t('columns.email')})}>
                  {t('columns.email')}
                </TableSortHeaderCell>
                <TableActionsHeaderCell label={t('actionsColumn')} />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.isPending ? (
                <SkeletonRows />
              ) : users.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {query.q || query.role ? t('emptyFiltered') : t('empty')}
                </TableEmptyRow>
              ) : (
                users.data.items.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    selected={selected.has(user.id)}
                    onSelect={(on) => toggle(user.id, on)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>

          {users.data ? (
            <Pagination
              page={users.data.page}
              limit={users.data.limit}
              total={users.data.total}
              onPageChange={setPage}
              isLoading={users.isFetching}
            />
          ) : null}
          {selectedCount > 0 ? (
            <TableBulkBar
              className="sticky bottom-4 mx-auto mt-3"
              label={t('selected', {count: selectedCount})}
              toolbarLabel={t('bulkActions')}>
              <TableBulkAction
                label={t('exportSelected')}
                icon={LUCIDE.download}
                onClick={() =>
                  exportUsers(rows.filter((user) => selected.has(user.id)))
                }
              />
            </TableBulkBar>
          ) : null}
        </div>
      )}
    </main>
  )
}

/** Quotes a CSV field, and defuses a leading `=`/`+`/`-`/`@` so a sheet does not run it as a formula. */
function csvField(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

/** Downloads the selected rows as a CSV file, built in the browser. */
function exportUsers(users: AdminUser[]) {
  const lines = [
    ['id', 'username', 'displayName', 'email', 'role', 'createdAt'].join(','),
    ...users.map((user) =>
      [
        user.id,
        user.username,
        user.displayName ?? '',
        user.email,
        user.role,
        user.createdAt,
      ]
        .map(csvField)
        .join(','),
    ),
  ]
  const url = URL.createObjectURL(
    new Blob([lines.join('\n')], {type: 'text/csv'}),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'users.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: AdminUser
  selected: boolean
  onSelect: (on: boolean) => void
}) {
  const t = useTranslations('admin.users')
  const df = useDateFormat()
  const router = useRouter()
  const href = `/users/${user.id}`
  const name = user.displayName ?? user.username

  return (
    <TableRow
      onActivate={() => router.push(href)}
      className={selected ? 'bg-primary/10' : ''}>
      <TableCell onClick={(event) => event.stopPropagation()}>
        <Checkbox
          size="sm"
          aria-label={t('selectRow', {name})}
          checked={selected}
          onCheckedChange={(on) => onSelect(on === true)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar name={name} src={user.avatarUrl} size="sm" />
          <Link href={href} className="hover:underline">
            {name}
          </Link>
        </div>
      </TableCell>
      <TableCell>
        <Badge tone={user.role === 'admin' ? 'info' : 'neutral'}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {df.date(user.createdAt)}
      </TableCell>
      <TableCell>
        <Typography
          variant="body-3"
          as="span"
          className="flex items-center gap-2">
          {user.email}
          {user.emailVerifiedAt ? null : (
            <Badge tone="warning">{t('unverified')}</Badge>
          )}
        </Typography>
      </TableCell>
      <TableRowActions label={t('actionsColumn')}>
        <DropdownMenuItem
          icon={ICONS.externalLink}
          onSelect={() => router.push(href)}>
          {t('open')}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({length: 8}).map((_, index) => (
        <TableRow key={index} aria-busy="true">
          {Array.from({length: COLUMN_COUNT}).map((__, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
