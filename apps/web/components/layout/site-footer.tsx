import {HomeFooter} from '@/components/home/home-footer'

/**
 * The footer shared by all public areas (home, blog, knowledge):
 * brand lockup, monospace tagline and social icons on the left,
 * 4-column navigation on the right, hairline divider with copyright,
 * and the panoramic perspective scenery illustration.
 */
export async function SiteFooter() {
  return <HomeFooter />
}
