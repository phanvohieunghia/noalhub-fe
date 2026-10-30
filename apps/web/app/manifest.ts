import type {MetadataRoute} from 'next'

/**
 * Lets the site be added to the home screen and opened without browser chrome.
 * That is the only way to get a full-screen exam on an iPhone: Safari has no
 * Fullscreen API for pages, but a home-screen web app launches `standalone`.
 * `/manifest.webmanifest` contains a dot, so `proxy.ts` leaves it alone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Noalhub',
    short_name: 'Noalhub',
    start_url: '/',
    display: 'standalone',
    // Matches the logo tile; the standalone splash and status bar use these.
    background_color: '#113138',
    theme_color: '#113138',
    icons: [
      {src: '/icon-512.png', sizes: '512x512', type: 'image/png'},
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
