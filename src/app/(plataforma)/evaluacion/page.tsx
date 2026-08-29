'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QUESTIONS, LEVELS, DIMENSIONS, PRIORITY_PROGRAM, type DimId } from '@/lib/evaluacion'
import { useSession } from '@/lib/useSession'

type Result = {
  dimensions: Record<DimId, number>
  average: number
  levelIdx: number
  priority: DimId
}

export default function EvaluacionPage() {
  const { user } = useSession()
  const router = useRouter()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)

  const total = QUESTIONS.length
  const q = QUESTIONS[i]

  function pick(optIdx: number) {
    const next = [...answers]
    next[i] = optIdx
    setAnswers(next)
    if (i + 1 < total) {
      setI(i + 1)
    } else {
      submit(next)
    }
  }

  async function submit(all: number[]) {
    setSending(true)
    setMsg('')
    try {
      const res = await fetch('/api/evaluacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: all }),
      })
      const json = await res.json()
      if (json.ok) {
        setResult(json.result)
      } else if (res.status === 401) {
        // sin sesión: calcular en cliente para mostrar el resultado igual
        const { scoreAssessment } = await import('@/lib/evaluacion')
        setResult(scoreAssessment(all))
        setMsg('Crea una cuenta para guardar tu evolución.')
      } else {
        setMsg(json.error || 'No se pudo guardar el test.')
      }
    } catch {
      setMsg('Error de conexión.')
    } finally {
      setSending(false)
    }
  }

  if (result) {
    const lvl = LEVELS[result.levelIdx]
    const prio = DIMENSIONS.find((d) => d.id === result.priority)
    const prog = PRIORITY_PROGRAM[result.priority]
    return (
      <>
        <p className="eyebrow">Tu resultado</p>
        <h1>Este es tu punto de partida</h1>
        <div className="plat-level">
          <div className="lname">{lvl.name}</div>
          <div className="ldesc">{lvl.desc}</div>
        </div>
        <p>
          Tu área que más pide cuidado ahora mismo parece ser{' '}
          <strong>{prio?.label.toLowerCase()}</strong> — {prio?.low.toLowerCase()}.
        </p>
        <div className="plat-reco">
          <Link href="/mapa">
            <span>
              <strong>Ver tu mapa emocional</strong>
              <br />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                Todas tus dimensiones
              </span>
            </span>
            <span className="arw">→</span>
          </Link>
          <Link href={`/#programas`}>
            <span>
              <strong>Programa: {prog.label}</strong>
              <br />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Un camino de días</span>
            </span>
            <span className="arw">→</span>
          </Link>
        </div>
        {msg && <p className="plat-msg ok">{msg}</p>}
        <p className="plat-disclaimer">
          Este resultado es orientativo y no sustituye una evaluación profesional. Es un
          punto de partida para conocerte mejor, no una etiqueta.
        </p>
        <button
          className="plat-btn ghost"
          style={{ marginTop: 8 }}
          onClick={() => router.push('/hoy')}
        >
          Volver a Hoy
        </button>
      </>
    )
  }

  return (
    <>
      <p className="eyebrow">Test de niveles</p>
      <h1>Conócete un poco mejor</h1>
      {!user && (
        <p className="lede">
          Responde con honestidad, sin juicios. Puedes hacerlo sin cuenta.
        </p>
      )}
      <div className="plat-progress">
        <span style={{ width: `${((i + 1) / total) * 100}%` }} />
      </div>
      <p className="plat-qnum">
        Pregunta {i + 1} de {total}
      </p>
      <h2 style={{ fontSize: '1.25rem', marginTop: 8 }}>{q.q}</h2>
      <div className="plat-options">
        {q.a.map((opt, idx) => (
          <button
            key={idx}
            className={`plat-opt ${answers[i] === idx ? 'sel' : ''}`}
            disabled={sending}
            onClick={() => pick(idx)}
          >
            {opt}
          </button>
        ))}
      </div>
      {i > 0 && (
        <button className="plat-btn ghost" onClick={() => setI(i - 1)} disabled={sending}>
          Anterior
        </button>
      )}
      {sending && <p className="plat-msg">Calculando tu mapa…</p>}
      {msg && <p className="plat-msg err">{msg}</p>}
    </>
  )
}
