'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LEVELS } from '@/lib/evaluacion'

type Data = {
  activeDays: number
  streak: number
  longestStreak: number
  returned: boolean
  checkins: number
  lastCheckin: string | null
  tests: { score: number; level_idx: number; created_at: string }[]
  firstScore: number | null
  lastScore: number | null
  achievements: { id: string; label: string; got: boolean }[]
}

export default function ProgresoPage() {
  const [data, setData] = useState<Data | null>(null)
  const [needAuth, setNeedAuth] = useState(false)

  useEffect(() => {
    fetch('/api/progreso', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j.needAuth) setNeedAuth(true)
        else setData(j)
      })
      .catch(() => {})
  }, [])

  if (needAuth) {
    return (
      <>
        <p className="eyebrow">Mi progreso</p>
        <h1>Tu camino, guardado</h1>
        <p className="lede">Crea una cuenta y verás aquí tu evolución día a día.</p>
        <Link
          href="/entrar"
          className="plat-btn"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Crear cuenta / entrar
        </Link>
      </>
    )
  }
  if (!data) return <p className="plat-empty">Cargando…</p>

  const level =
    data.tests.length > 0 ? LEVELS[data.tests[data.tests.length - 1].level_idx] : null
  const gotAch = data.achievements.filter((a) => a.got)

  return (
    <>
      <p className="eyebrow">Mi progreso</p>
      <h1>{data.returned ? 'Has vuelto. Continuemos desde aquí.' : 'Tu camino'}</h1>

      <div className="plat-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          <Stat n={data.streak} l={data.streak === 1 ? 'día seguido' : 'días seguidos'} />
          <Stat n={data.activeDays} l="días contigo" />
          <Stat n={data.longestStreak} l="tu mejor racha" />
        </div>
        {data.returned && (
          <p style={{ fontSize: 13, color: 'var(--sand)', margin: '14px 0 0' }}>
            Dejaste de venir unos días y has vuelto. Eso también es cuidarte. No empiezas
            de cero.
          </p>
        )}
      </div>

      {level && (
        <div className="plat-level">
          <div className="lname">{level.name}</div>
          <div className="ldesc">{level.desc}</div>
        </div>
      )}

      {data.firstScore != null && data.lastScore != null && data.tests.length > 1 && (
        <div className="plat-card">
          <h2 style={{ margin: '0 0 6px' }}>Tu bienestar general</h2>
          <p style={{ margin: 0, fontSize: 15 }}>
            <strong style={{ fontSize: 22, color: 'var(--rose)' }}>
              {data.firstScore} → {data.lastScore}
            </strong>
          </p>
          <p className="plat-disclaimer" style={{ margin: '8px 0 0' }}>
            Es normal que suba y baje. Mira la dirección con el tiempo, no un día concreto.
          </p>
          <Link href="/mapa" style={{ color: 'var(--rose)', fontSize: 14 }}>
            Ver el mapa completo →
          </Link>
        </div>
      )}

      <div className="plat-card">
        <h2 style={{ margin: '0 0 12px' }}>
          Logros ({gotAch.length}/{data.achievements.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {data.achievements.map((a) => (
            <div
              key={a.id}
              style={{
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 12,
                border: `1px solid var(--border)`,
                background: a.got ? 'rgba(224,80,138,0.12)' : 'transparent',
                color: a.got ? 'var(--ink)' : 'var(--ink-mute)',
              }}
            >
              {a.got ? '✦ ' : '· '}
              {a.label}
            </div>
          ))}
        </div>
        <p className="plat-disclaimer" style={{ margin: '12px 0 0' }}>
          No hay rankings ni comparaciones con nadie. Esto es solo tuyo.
        </p>
      </div>

      <Link
        href="/hoy"
        className="plat-btn"
        style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}
      >
        Hacer el check-in de hoy
      </Link>
    </>
  )
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: 'var(--rose)' }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {l}
      </div>
    </div>
  )
}
