import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useState} from 'react'
import {TablePagination} from '@noalhub/ui/table-pagination'

const TOTAL = 137

/**
 * The footer of a table frame: summary on the left, then page size, "Page x of y"
 * and previous/next. Stateless — the owner keeps `page` and `pageSize` and clamps
 * `page` against `pageCount`.
 */
const meta: Meta<typeof TablePagination> = {
  title: 'UI/Navigation/TablePagination',
  component: TablePagination,
  parameters: {layout: 'padded'},
}

export default meta
type Story = StoryObj<typeof TablePagination>

function Demo({initialPage = 1}: {initialPage?: number}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(20)
  const pageCount = Math.ceil(TOTAL / pageSize)
  const current = Math.min(page, pageCount)
  const from = (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, TOTAL)

  return (
    <div className="rounded-lg border border-border bg-surface">
      <TablePagination
        summary={`${from}–${to} of ${TOTAL} prompts`}
        page={current}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizes={[10, 20, 50]}
        perPageLabel="Prompts per page"
        formatPageSize={(size) => `${size} / page`}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}

export const Default: Story = {render: () => <Demo />}

/** Last page: "next" is disabled. */
export const LastPage: Story = {render: () => <Demo initialPage={7} />}
