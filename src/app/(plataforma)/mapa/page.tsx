'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DIMENSIONS,
  LEVELS,
  PRIORITY_PROGRAM,
  type DimId,
} from '@/lib/evaluacion'
import { PlatHeader } from '../_ui'

type Entry = {
  score: number
  level_idx: number
  dimensions: Record<DimId, number> | null
  created_at: string
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function MapaPage() {
  const [history, setHistory] = useState<Entry[] | null>(null)

  useEffect(() => {
    fetch('/api/evaluacion', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setHistory(j.history ?? []))
      .catch(() => setHistory([]))
  }, [])

  if (history === null) {
    return <p className="plat-empty">Cargando…</p>
  }

  const latest = history.find((h) => h.dimensions)
  const previous = history.slice(history.indexOf(latest as Entry) + 1).find((h) => h.dimensions)

  if (!latest || !latest.dimensions) {
    return (
      <>
        <PlatHeader title="Mapa emocional" sub="Aún no tienes un mapa." />
        <p className="c-sub" style={{ margin: '2px 0 16px' }}>
          Haz el test y verás aquí cómo estás en cada área, qué necesita más cuidado y,
          con el tiempo, tu evolución.
        </p>
        <Link href="/evaluacion" className="btn block" style={{ textDecoration: 'none' }}>
          Hacer el test
        </Link>
      </>
    )
  }

  const dims = latest.dimensions
  const lvl = LEVELS[latest.level_idx]
  const sorted = [...DIMENSIONS].sort((a, b) => dims[a.id] - dims[b.id])
  const priority = sorted[0]
  const prog = PRIORITY_PROGRAM[priority.id]

  return (
    <>
      <PlatHeader title="Mapa emocional" sub={`Cómo estás ahora · ${fmt(latest.created_at)}`} />

      <div className="plat-level">
        <div className="lname">{lvl.name}</div>
        <div className="ldesc">{lvl.desc}</div>
      </div>

      <div className="plat-card">
        {DIMENSIONS.map((d) => {
          const v = dims[d.id]
          const prev = previous?.dimensions?.[d.id]
          const low = v < 45
          return (
            <div className="plat-map-row" key={d.id}>
              <div className="top">
                <span>{d.label}</span>
                <span className="val">
                  {prev != null && prev !== v && (
                    <span style={{ color: 'var(--muted)' }}>{prev} → </span>
                  )}
                  {v}
                </span>
              </div>
              <div className="plat-map-track">
                <div
                  className={`plat-map-fill ${low ? 'low' : ''}`}
                  style={{ width: `${Math.max(4, v)}%` }}
                />
              </div>
              <div className="hint">{v < 45 ? d.low : d.high}</div>
            </div>
          )
        })}
      </div>

      <div className="plat-card">
        <h2 style={{ margin: '0 0 6px' }}>Tu área prioritaria</h2>
        <p style={{ margin: 0 }}>
          <strong>{priority.label}</strong> — {priority.low.toLowerCase()}. Es por donde
          te recomendamos empezar.
        </p>
        <div className="plat-reco">
          <Link href="/programas">
            <span>
              <strong>Programa: {prog.label}</strong>
              <br />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Un camino de días</span>
            </span>
            <span className="arw">→</span>
          </Link>
          <Link href="/ritual">
            <span>
              <strong>Ritual del día</strong>
              <br />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                Un pequeño paso hoy
              </span>
            </span>
            <span className="arw">→</span>
          </Link>
        </div>
      </div>

      {previous && (
        <div className="plat-card">
          <h2 style={{ margin: '0 0 6px' }}>Tu evolución</h2>
          <p style={{ margin: '0 0 4px', color: 'var(--sand)', fontSize: 14 }}>
            Desde {fmt(previous.created_at)}: bienestar general{' '}
            <strong>
              {previous.score} → {latest.score}
            </strong>
          </p>
          <p className="plat-disclaimer" style={{ margin: '8px 0 0' }}>
            La evolución es normal que suba y baje. Lo importante es la dirección con el
            tiempo, no un día concreto.
          </p>
        </div>
      )}

      <Link
        href="/evaluacion"
        className="plat-btn ghost"
        style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}
      >
        Repetir el test
      </Link>

      <p className="plat-disclaimer">
        Este mapa es orientativo y no sustituye una evaluación profesional.
      </p>
    </>
  )
}
