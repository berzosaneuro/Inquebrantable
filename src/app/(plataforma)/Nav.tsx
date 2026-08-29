'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/hoy', label: 'Hoy' },
  { href: '/evaluacion', label: 'Test' },
  { href: '/mapa', label: 'Mapa' },
  { href: '/diario', label: 'Diario' },
  { href: '/refugio', label: 'Refugio' },
  { href: '/circulos', label: 'Círculos' },
  { href: '/pregunta', label: 'Pregunta' },
  { href: '/herramientas', label: 'Herramientas' },
  { href: '/progreso', label: 'Progreso' },
  { href: '/recursos', label: 'Recursos' },
  { href: '/', label: 'App clásica' },
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="plat-nav">
      <div className="plat-nav-inner">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? 'on' : ''}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
