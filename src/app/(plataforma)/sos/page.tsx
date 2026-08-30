'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'
import { kvGet, kvSet } from '@/lib/kv'
import { PlatHeader } from '../_ui'

// 4-7-8
const FASES: { label: string; ms: number; scale: number }[] = [
  { label: 'Inhala por la nariz', ms: 4000, scale: 1 },
  { label: 'Sostén', ms: 7000, scale: 1 },
  { label: 'Exhala despacio', ms: 8000, scale: 0.55 },
]
const FRASES = [
  'Estás a salvo en este momento.',
  'Esto va a bajar. Siempre baja.',
  'No tienes que hacer nada. Solo respirar.',
  'Un momento a la vez.',
]

export default function SosPage() {
  const { user } = useSession()
  const [running, setRunning] = useState(false)
  const [ciclos, setCiclos] = useState(0)
  const [fase, setFase] = useState<{ label: string; scale: number } | null>(null)
  const [frase, setFrase] = useState(FRASES[0])
  const [post, setPost] = useState(false)
  const [texto, setTexto] = useState('')
  const [guardado, setGuardado] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function empezar() {
    if (running) return
    setRunning(true); setPost(false); setCiclos(0)
    let c = 0
    const paso = (fi: number) => {
      const f = FASES[fi]
      setFase({ label: f.label, scale: f.scale })
      if (fi === 0) setFrase(FRASES[c % FRASES.length])
      const t = setTimeout(() => {
        if (fi + 1 < FASES.length) paso(fi + 1)
        else {
          c += 1; setCiclos(c)
          if (c < 4) paso(0)
          else detener(true)
        }
      }, f.ms)
      timers.current.push(t)
    }
    paso(0)
  }

  function detener(natural = false) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setRunning(false)
    setFase(null)
    if (natural || ciclos > 0) setPost(true)
  }

  async function guardar() {
    if (user) {
      const prev = await kvGet<unknown[]>('inq-sos-hist', [])
      await kvSet('inq-sos-hist', [
        { at: new Date().toISOString(), texto },
        ...(Array.isArray(prev) ? prev : []),
      ].slice(0, 50))
    }
    setGuardado(true)
  }

  return (
    <>
      <PlatHeader title="Estoy aquí contigo" sub="No tienes que hacer nada. Solo respira." />

      <div className="sos-stage">
        <div
          className={`sos-orb ${running ? 'on' : ''}`}
          style={fase ? { transform: `scale(${fase.scale})`, transitionDuration: `${fase.scale < 1 ? 8 : 4}s` } : undefined}
        />
        <p className="sos-fase">{running ? fase?.label : ciclos >= 4 ? 'Lo has hecho' : 'Cuando quieras'}</p>
        <p className="sos-frase">{frase}</p>
        {running && <p className="c-sub">{ciclos} / 4 respiraciones</p>}

        {!running && !post && (
          <button className="btn block" onClick={empezar} style={{ marginTop: 8 }}>Respirar contigo</button>
        )}
        {running && (
          <button className="btn ghost block" onClick={() => detener(false)} style={{ marginTop: 8 }}>Ya estoy mejor</button>
        )}
      </div>

      {post && (
        <div className="card">
          <p className="c-label">Después de respirar</p>
          <p className="c-title" style={{ fontSize: '1.3rem' }}>¿Qué está pasando en ti ahora mismo?</p>
          <label className="field" style={{ marginTop: 12 }}>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4}
              placeholder="No hay respuestas correctas. Escribe lo que salga…" />
          </label>
          <button className="btn block" onClick={guardar} disabled={guardado || texto.trim().length < 2}>
            {guardado ? 'Guardado' : 'Guardar y soltar'}
          </button>
          {!user && <p className="c-sub" style={{ marginTop: 8 }}>Crea una cuenta para guardar tu historial SOS.</p>}
        </div>
      )}

      <p className="plat-disclaimer">
        Si hay riesgo para ti o para alguien, esto no es suficiente. Mira{' '}
        <Link href="/recursos" style={{ color: 'var(--rose-deep)' }}>Recursos de ayuda</Link>{' '}
        o llama al <strong>024</strong> / <strong>112</strong>.
      </p>
    </>
  )
}
