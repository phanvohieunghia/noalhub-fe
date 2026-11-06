import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {getTranslations} from 'next-intl/server'

import {getBlogCategories} from '@noalhub/api/blog/server'
import {CategoryFilter as CategoryFilterView} from '@noalhub/ui/blog/category-filter'

/**
 * "All" plus every category, above a listing. Fetched here (cached at the
 * `fetch` layer, like the nav in the public layout) so a failure leaves the page
 * without the row instead of without the posts.
 */
export async function CategoryFilter({current}: {current?: string}) {
  const t = await getTranslations('web.blog')
  const categories = await getBlogCategories().catch(() => [])

  return (
    <CategoryFilterView
      Link={Link}
      label={t('list.filterLabel')}
      items={[
        {
          href: routes.blog,
          label: t('list.all'),
          current: current === undefined,
        },
        ...categories.map((category) => ({
          href: routes.blogCategory(category.slug),
          label: category.name,
          current: category.slug === current,
        })),
      ]}
    />
  )
}
