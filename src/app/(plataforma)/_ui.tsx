import type { ReactNode } from 'react'

/** Cabecera oscura a sangre — clon de la referencia (Mi camino / Refugio / …). */
export function PlatHeader({
  title,
  sub,
  action,
}: {
  title: string
  sub: string
  action?: ReactNode
}) {
  return (
    <header className="plat-topbar">
      <div className="tb-title">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </header>
  )
}

export const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path
      d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconPeople = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c.7-3 3-4.5 5.5-4.5S13.8 16 14.5 19" strokeLinecap="round" />
    <path d="M15.5 6.2A2.8 2.8 0 0 1 18 11M16.5 14.6c2.1.4 3.6 1.9 4 4.4" strokeLinecap="round" />
  </svg>
)

export const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
)

/* ── ilustraciones line-art ── */
export const Butterfly = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M32 20v26" strokeLinecap="round" />
    <path d="M32 22c-3-8-11-13-17-9-4 3-4 12 1 17 4 4 12 5 16 1M32 22c3-8 11-13 17-9 4 3 4 12-1 17-4 4-12 5-16 1" strokeLinejoin="round" />
    <path d="M32 34c-2 5-7 9-12 8M32 34c2 5 7 9 12 8" strokeLinecap="round" />
    <circle cx="32" cy="17" r="2" />
    <path d="M31 15c-1-2-3-3-4-2M33 15c1-2 3-3 4-2" strokeLinecap="round" />
  </svg>
)

export const Leaf = () => (
  <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M20 62C18 40 30 20 60 16c2 26-12 44-40 46Z" strokeLinejoin="round" />
    <path d="M24 58C34 44 46 32 56 22M31 52c4-1 9-2 13-1M38 42c4-2 9-3 13-2M45 33c4-1 8-1 11 0" strokeLinecap="round" />
  </svg>
)

export const Bloom = () => (
  <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.3">
    <path d="M40 70V38" strokeLinecap="round" />
    <path d="M40 40c-8 2-14-2-15-10 8-2 14 2 15 10ZM40 40c8 2 14-2 15-10-8-2-14 2-15 10ZM40 34c-4-6-3-13 3-17 4 6 3 13-3 17Z" strokeLinejoin="round" />
    <path d="M40 52c-3-4-8-5-12-3M40 52c3-4 8-5 12-3" strokeLinecap="round" />
  </svg>
)

/* iconitos de los nodos del recorrido */
export const stepIcon = (i: number) => {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (i === 0) return <svg viewBox="0 0 24 24" {...p}><path d="M12 3v6M7 21c0-5 2-8 5-8s5 3 5 8M9 12l-3-2M15 12l3-2" /></svg>
  if (i === 1) return <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2" /></svg>
  if (i === 2) return <svg viewBox="0 0 24 24" {...p}><path d="M6 21V10l6-5 6 5v11M10 21v-5h4v5" /></svg>
  return <svg viewBox="0 0 24 24" {...p}><path d="M12 3l2.3 5.6L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.7-.4Z" /></svg>
}
