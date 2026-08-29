'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/useSession'

type Answer = { id: number; author: string; body: string; created_at: string; isMine: boolean }

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `hace ${Math.max(1, Math.floor(s / 60))} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function PreguntaPage() {
  const { user, loading } = useSession()
  const [question, setQuestion] = useState<{ id: number; question: string } | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [body, setBody] = useState('')
  const [anon, setAnon] = useState(true)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const j = await fetch('/api/pregunta', { cache: 'no-store' }).then((r) => r.json())
    setQuestion(j.question ?? null)
    setAnswers(j.answers ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function send() {
    if (!body.trim() || !question) return
    setMsg('')
    const res = await fetch('/api/pregunta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, body, anonymous: anon }),
    })
    const j = await res.json()
    if (j.ok) {
      setBody('')
      load()
    } else {
      setMsg(j.error || 'No se pudo enviar.')
    }
  }

  if (!question) {
    return (
      <>
        <p className="eyebrow">Pregunta del día</p>
        <h1>Hoy no hay pregunta</h1>
        <p className="lede">Vuelve mañana.</p>
      </>
    )
  }

  return (
    <>
      <p className="eyebrow">Pregunta del día</p>
      <h1>{question.question}</h1>

      {!loading && !user ? (
        <>
          <p className="lede">Necesitas una cuenta para responder y leer a otras.</p>
          <Link href="/clasica#menu" className="plat-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Crear cuenta / entrar
          </Link>
        </>
      ) : (
        <div className="plat-card">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Tu respuesta…"
            style={{
              width: '100%',
              background: 'var(--card2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--cream)',
              padding: '10px 12px',
              fontFamily: 'inherit',
              fontSize: 15,
              resize: 'vertical',
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--sand)', margin: '10px 0' }}>
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            Responder como anónima
          </label>
          <button className="plat-btn" onClick={send} disabled={!body.trim()}>
            Responder
          </button>
          {msg && <p className="plat-msg err">{msg}</p>}
        </div>
      )}

      {answers.length > 0 && (
        <>
          <h2>Respuestas de otras mujeres</h2>
          {answers.map((a) => (
            <div className="plat-card" key={a.id}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}>
                {a.author} · {ago(a.created_at)}
              </p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{a.body}</p>
            </div>
          ))}
        </>
      )}
    </>
  )
}
