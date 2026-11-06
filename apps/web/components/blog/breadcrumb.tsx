import {Link} from '@noalhub/i18n/navigation'
import {useTranslations} from 'next-intl'

import {JsonLd} from './json-ld'
import {absoluteUrl} from '@noalhub/core/blog/seo'
import {BreadcrumbNav, type Crumb} from '@noalhub/ui/blog/breadcrumb-nav'

export type {Crumb}

/**
 * The visible breadcrumb **and** the `BreadcrumbList` JSON-LD, from one array.
 *
 * Sharing a single source is deliberate: structured data on a page with no real
 * breadcrumb is a mismatch in Google's eyes, and two separately written lists
 * drift apart on the first edit (§6.1, §6.2).
 *
 * The category axis is what gives posts a **three-level** breadcrumb:
 * Blog → <category> → <post title>. Without that axis there are only two levels
 * and it is close to meaningless (§6.2).
 */
export function Breadcrumb({
  items,
  visible = true,
}: {
  items: Crumb[]
  /** `false` keeps only the JSON-LD — for a lone crumb that repeats the page's `h1`. */
  visible?: boolean
}) {
  const t = useTranslations('web.blog.breadcrumb')

  return (
    <>
      {visible ? (
        <BreadcrumbNav Link={Link} label={t('label')} items={items} />
      ) : null}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            ...(item.href ? {item: absoluteUrl(item.href)} : {}),
          })),
        }}
      />
    </>
  )
}
