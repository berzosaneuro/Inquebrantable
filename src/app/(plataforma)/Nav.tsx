'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Navegación principal: 5 áreas. Todo lo demás vive dentro de ellas.
const AREAS = [
  { href: '/hoy', label: 'Hoy', match: ['/hoy'] },
  { href: '/mi-camino', label: 'Mi camino', match: ['/mi-camino', '/evaluacion', '/mapa', '/diario', '/progreso'] },
  { href: '/refugio', label: 'Refugio', match: ['/refugio', '/circulos', '/pregunta'] },
  { href: '/herramientas', label: 'Herramientas', match: ['/herramientas', '/recursos'] },
  { href: '/yo', label: 'Yo', match: ['/yo'] },
]

export default function Nav() {
  const path = usePathname()
  return (
    <div className="plat-tabbar" role="navigation" aria-label="Navegación principal">
      {AREAS.map((a) => {
        const active = a.match.some((m) => path === m || path.startsWith(m + '/'))
        return (
          <Link key={a.href} href={a.href} className={active ? 'on' : ''}>
            {a.label}
          </Link>
        )
      })}
    </div>
  )
}
