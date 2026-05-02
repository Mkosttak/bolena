import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bolena Cafe',
    short_name: 'Bolena',
    description: 'Glutensiz kafe — menü, sipariş, rezervasyon',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F2',
    theme_color: '#1B3C2A',
    icons: [
      {
        src: '/images/bolena_logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/bolena_logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
