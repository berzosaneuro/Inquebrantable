import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://inquebrantable.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '',
    '/hoy',
    '/evaluacion',
    '/herramientas',
    '/recursos',
    '/circulos',
    '/test',
    '/ansiedad',
    '/autoestima',
    '/limites',
    '/ruptura',
    '/relaciones',
    '/dependencia',
  ]
  return paths.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date('2026-08-29'),
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }))
}
