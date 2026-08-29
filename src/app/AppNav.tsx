'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './appnav.css'

const ICONS: Record<string, React.ReactNode> = {
  hoy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  ),
  camino: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  ),
  refugio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20s-7-4.3-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.7 12 20 12 20z" strokeLinejoin="round" />
    </svg>
  ),
  herramientas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 14 4.5 19.5a2.1 2.1 0 0 1-3-3L7 11M14 10l5.5-5.5a2.1 2.1 0 0 0-3-3L11 7" strokeLinecap="round" />
      <path d="m9.5 9.5 5 5" strokeLinecap="round" />
    </svg>
  ),
  yo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="3.4" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" strokeLinecap="round" />
    </svg>
  ),
}

const AREAS = [
  { href: '/hoy', label: 'Hoy', icon: 'hoy', match: ['/hoy'] },
  { href: '/mi-camino', label: 'Mi camino', icon: 'camino', match: ['/mi-camino', '/evaluacion', '/mapa', '/diario', '/progreso'] },
  { href: '/refugio', label: 'Refugio', icon: 'refugio', match: ['/refugio', '/circulos', '/pregunta'] },
  { href: '/herramientas', label: 'Herramientas', icon: 'herramientas', match: ['/herramientas', '/recursos'] },
  { href: '/yo', label: 'Yo', icon: 'yo', match: ['/yo'] },
]

export default function AppNav() {
  const path = usePathname()
  if (path.startsWith('/clasica') || path.startsWith('/admin')) return null

  return (
    <nav className="appnav" aria-label="Navegación principal">
      {AREAS.map((a) => {
        const active =
          (a.href === '/hoy' && path === '/') ||
          a.match.some((m) => path === m || path.startsWith(m + '/'))
        return (
          <Link key={a.href} href={a.href} className={active ? 'on' : ''}>
            <span className="ic">{ICONS[a.icon]}</span>
            <span className="tx">{a.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
