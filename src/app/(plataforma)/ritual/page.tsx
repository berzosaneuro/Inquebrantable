'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/useSession'
import { kvGet, kvSet } from '@/lib/kv'
import { PlatHeader } from '../_ui'

const AFIRMACIONES = [
  'Hoy me elijo a mí.',
  'Mi energía es mía. La invierto con criterio.',
  'No me rompí. Me abrí para renacer.',
  'Mis límites son actos de amor.',
  'Soy suficiente, sin dar nada extra.',
  'De mis grietas nació mi fuerza.',
  'Hoy cierro lo que ya no me pertenece.',
  'Merezco el mismo cuidado que doy.',
  'Ser fiel a mí misma no es traicionar a nadie.',
  'Mi prioridad soy yo.',
]

const CICLOS = 4
const FASES: { label: string; ms: number; scale: number }[] = [
  { label: 'Inhala…', ms: 4000, scale: 1 },
  { label: 'Sostén', ms: 2000, scale: 1 },
  { label: 'Exhala…', ms: 6000, scale: 0.62 },
]

function hoyKey() {
  return 'inq-ritual-' + new Date().toISOString().slice(0, 10)
}

export default function RitualPage() {
  const { user } = useSession()
  const [breathDone, setBreathDone] = useState(false)
  const [running, setRunning] = useState(false)
  const [fase, setFase] = useState<{ label: string; scale: number } | null>(null)
  const [texto, setTexto] = useState('')
  const [afirmacion, setAfirmacion] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    kvGet<{ done?: boolean; texto?: string }>(hoyKey(), {}).then((v) => {
      if (v.done) { setBreathDone(true); setGuardado(true) }
      if (v.texto) setTexto(v.texto)
      if (v.done) setAfirmacion(AFIRMACIONES[new Date().getDay() % AFIRMACIONES.length])
    })
    return () => timers.current.forEach(clearTimeout)
  }, [])

  function respirar() {
    if (running) return
    setRunning(true)
    let ciclo = 0
    const paso = (fi: number) => {
      const f = FASES[fi]
      setFase({ label: f.label, scale: f.scale })
      const t = setTimeout(() => {
        if (fi + 1 < FASES.length) paso(fi + 1)
        else {
          ciclo += 1
          if (ciclo < CICLOS) paso(0)
          else {
            setRunning(false)
            setFase(null)
            setBreathDone(true)
          }
        }
      }, f.ms)
      timers.current.push(t)
    }
    paso(0)
  }

  async function desbloquear() {
    const a = AFIRMACIONES[new Date().getDay() % AFIRMACIONES.length]
    setAfirmacion(a)
    if (user) {
      await kvSet(hoyKey(), { done: true, texto })
      await kvSet('inq-ritual-resp', { fecha: new Date().toISOString().slice(0, 10), texto })
      setGuardado(true)
    }
  }

  return (
    <>
      <PlatHeader title="Ritual diario" sub="Unos minutos solo para ti. Sin prisa." />

      {/* PASO I — respirar */}
      <div className="card">
        <p className="c-label">Paso I</p>
        <p className="c-title" style={{ fontSize: '1.4rem' }}>Respira</p>
        <p className="c-sub">Cuatro respiraciones guiadas. Suelta el ruido de hoy.</p>

        <div className="ritual-orb-wrap">
          <div
            className={`ritual-orb ${running ? 'on' : ''} ${breathDone && !running ? 'done' : ''}`}
            style={fase ? { transform: `scale(${fase.scale})`, transitionDuration: `${fase.scale < 1 ? 6 : 4}s` } : undefined}
          />
          <span className="ritual-orb-lbl">
            {running ? fase?.label : breathDone ? 'Hecho ✓' : 'Cuando quieras'}
          </span>
        </div>

        {!breathDone && (
          <button className="btn block" onClick={respirar} disabled={running}>
            {running ? 'Respirando…' : 'Comenzar respiración'}
          </button>
        )}
      </div>

      {/* PASO II — escribir */}
      <div className="card">
        <p className="c-label">Paso II</p>
        <p className="c-title" style={{ fontSize: '1.4rem' }}>Escribe cómo te sientes</p>
        <p className="c-sub">Sin filtros. Sin correcciones. Lo que salga.</p>
        <label className="field" style={{ marginTop: 12 }}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder="Hoy me siento…"
          />
        </label>
        <button
          className="btn block"
          onClick={desbloquear}
          disabled={!breathDone || texto.trim().length < 3 || (!!afirmacion && guardado)}
        >
          {afirmacion ? 'Afirmación recibida' : 'Recibir mi afirmación'}
        </button>
        {!breathDone && <p className="c-sub" style={{ marginTop: 8 }}>Completa la respiración para desbloquear tu afirmación.</p>}
      </div>

      {/* AFIRMACIÓN */}
      {afirmacion && (
        <div className="card navy" style={{ textAlign: 'center' }}>
          <p className="c-label">Afirmación de hoy</p>
          <p className="ritual-afirm">{afirmacion}</p>
          {user
            ? guardado && <p className="c-sub" style={{ marginTop: 10 }}>Guardado en tu progreso.</p>
            : <p className="c-sub" style={{ marginTop: 10 }}>Crea una cuenta para guardar tu ritual.</p>}
        </div>
      )}
    </>
  )
}
