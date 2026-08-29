'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'

const MOODS = [
  { id: 'mal', em: '🌧️', label: 'Mal' },
  { id: 'ansiosa', em: '🌀', label: 'Ansiosa' },
  { id: 'triste', em: '💧', label: 'Triste' },
  { id: 'agotada', em: '🥀', label: 'Agotada' },
  { id: 'normal', em: '\u{1F311}', label: 'Normal' },
  { id: 'bien', em: '🌿', label: 'Bien' },
  { id: 'muy_bien', em: '✨', label: 'Muy bien' },
] as const

const NEEDS = [
  { id: 'calmarme', label: 'Calmarme' },
  { id: 'hablar', label: 'Hablar' },
  { id: 'entender', label: 'Entender lo que siento' },
  { id: 'acompanada', label: 'Sentirme acompañada' },
  { id: 'trabajar', label: 'Trabajar en mí' },
  { id: 'ayuda', label: 'Pedir ayuda' },
] as const

type Reco = { href: string; label: string; sub: string }

const RECOS: Record<string, Reco[]> = {
  calmarme: [
    { href: '/#sos', label: 'Respiración SOS', sub: 'Regúlate en 2 minutos' },
    { href: '/herramientas', label: 'Necesito calmarme', sub: 'Herramienta guiada' },
  ],
  hablar: [
    { href: '/#refugio', label: 'El Refugio', sub: 'Escribe y te leen otras mujeres' },
    { href: '/herramientas', label: 'Ordenar lo que pienso', sub: 'Antes de hablar con alguien' },
  ],
  entender: [
    { href: '/evaluacion', label: 'Hacer el test', sub: 'Tu mapa emocional' },
    { href: '/diario', label: 'Escribir en el diario', sub: '¿Qué siento? ¿Qué necesito?' },
  ],
  acompanada: [
    { href: '/#refugio', label: 'El Refugio', sub: 'No estás sola aquí' },
    { href: '/#ritual', label: 'Ritual del día', sub: 'Un momento para ti' },
  ],
  trabajar: [
    { href: '/evaluacion', label: 'Hacer el test', sub: 'Descubre tu área prioritaria' },
    { href: '/#programas', label: 'Programas', sub: 'Un camino de días' },
  ],
  ayuda: [
    { href: '/recursos', label: 'Recursos de ayuda', sub: 'Teléfonos y organizaciones (España)' },
    { href: '/#sos', label: 'SOS', sub: 'Si lo necesitas ahora' },
  ],
}

export default function HoyPage() {
  const { user, loading } = useSession()
  const [mood, setMood] = useState<string | null>(null)
  const [need, setNeed] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function pickNeed(id: string) {
    setNeed(id)
    if (user) {
      fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, need: id }),
      })
        .then(() => setSaved(true))
        .catch(() => {})
    }
  }

  const recos = need ? RECOS[need] ?? [] : []

  return (
    <>
      <p className="eyebrow">Hoy</p>
      <h1>¿Cómo estás hoy?</h1>
      {!user && !loading && (
        <p className="lede">
          Puedes usar esto sin cuenta.{' '}
          <Link href="/#menu" style={{ color: 'var(--rose)' }}>
            Crea una cuenta
          </Link>{' '}
          para guardar tu evolución.
        </p>
      )}

      <div className="plat-options cols2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            className={`plat-opt ${mood === m.id ? 'sel' : ''}`}
            onClick={() => {
              setMood(m.id)
              setNeed(null)
              setSaved(false)
            }}
          >
            <span className="em">{m.em}</span>
            {m.label}
          </button>
        ))}
      </div>

      {mood && (
        <>
          <h2>¿Qué necesitas ahora?</h2>
          <div className="plat-options">
            {NEEDS.map((n) => (
              <button
                key={n.id}
                className={`plat-opt ${need === n.id ? 'sel' : ''}`}
                onClick={() => pickNeed(n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>
        </>
      )}

      {recos.length > 0 && (
        <div className="plat-card">
          <h2 style={{ margin: '0 0 4px' }}>Para ti ahora</h2>
          <div className="plat-reco">
            {recos.map((r) => (
              <Link key={r.href + r.label} href={r.href}>
                <span>
                  <strong>{r.label}</strong>
                  <br />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{r.sub}</span>
                </span>
                <span className="arw">→</span>
              </Link>
            ))}
          </div>
          {saved && <p className="plat-msg ok">Guardado en tu progreso.</p>}
        </div>
      )}
    </>
  )
}
